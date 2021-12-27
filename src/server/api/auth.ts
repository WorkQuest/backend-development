import * as path from "path";
import * as fs from "fs";
import * as querystring from "querystring";
import Handlebars = require("handlebars");
import { Op } from "sequelize";
import config from "../config/config";
import {Errors} from "../utils/errors";
import {addSendEmailJob} from "../jobs/sendEmail";
import {generateJwt} from "../utils/auth";
import {UserController} from "../controllers/user/controller.user";
import converter from 'bech32-converting';
import { Wallet } from "@workquest/database-models/lib/models";
import {
	error,
	output,
	getGeo,
	getRealIp,
	getDevice,
	getRandomHexToken,
} from "../utils";
import {
	User,
	Session,
	UserStatus,
	QuestsStatistic,
	defaultUserSettings,
} from "@workquest/database-models/lib/models";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "confirmEmail.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
	encoding: "utf-8"
}));

export function register(host: 'dao'|'main') {
	return async function(r) {
		await UserController.checkEmail(r.payload.email);

		const emailConfirmCode = getRandomHexToken().substring(0, 6).toUpperCase();
		const emailConfirmLink = host === 'main' ? `${config.baseUrl}/confirm?token=${emailConfirmCode}` : `${config.baseUrlDao}/confirm?token=${emailConfirmCode}`;
		const emailHtml = confirmTemplate({ confirmLink: emailConfirmLink, confirmCode: emailConfirmCode });

		await addSendEmailJob({
			email: r.payload.email,
			subject: "Work Quest | Confirmation code",
			text: `Your confirmation code is ${emailConfirmCode}. Follow this link ${config.baseUrl}/confirm?token=${emailConfirmCode}`,
			html: emailHtml,
		});

		const user = await User.create({
			email: r.payload.email.toLowerCase(),
			password: r.payload.password,
			firstName: r.payload.firstName,
			lastName: r.payload.lastName,
			settings: {
				...defaultUserSettings,
				emailConfirm: emailConfirmCode
			}
		});

		await QuestsStatistic.create({ userId: user.id });

		const session = await Session.create({
			userId: user.id,
			invalidating: false,
			place: getGeo(r),
			ip: getRealIp(r),
			device: getDevice(r),
		});

		const result = {
			...generateJwt({ id: session.id }),
			userStatus: user.status,
		};

		return output(result);
	}
}


export function getLoginViaSocialNetworkHandler(returnType: "token" | "redirect") {
	return async function loginThroughSocialNetwork(r, h) {
		const profile = r.auth.credentials.profile;

		if (!profile.email) {
			return error(Errors.InvalidEmail, "Field email was not returned", {});
		}

		const user = await UserController.getUserByNetworkProfile(r.auth.strategy, profile);

		const session = await Session.create({
			userId: user.id,
			invalidating: false,
			place: getGeo(r),
			ip: getRealIp(r),
			device: getDevice(r),
		});

		const result = {
			...generateJwt({ id: session.id }),
			userStatus: user.status
		};

		if (returnType === "redirect") {
			const qs = querystring.stringify(result);
			return h.redirect(config.baseUrl + "/sign-in?" + qs);
		}

		await QuestsStatistic.create({ userId: user.id });

		return output(result);
	};
}

export async function confirmEmail(r) {
	const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);
	const userController = new UserController(user);

	await userController
		.checkUserAlreadyConfirmed()
		.checkUserConfirmationCode(r.payload.confirmCode)

	if (r.payload.role) {
		await user.update({
			role: r.payload.role,
			status: UserStatus.Confirmed,
			"settings.emailConfirm": null,
			additionalInfo: UserController.getDefaultAdditionalInfo(r.payload.role),
		});
	} else {
		await user.update({
			status: UserStatus.NeedSetRole,
			"settings.emailConfirm": null
		});
	}

	return output({ status: user.status });
}

export async function login(r) {
	const user = await User.scope("withPassword").findOne({
		where: { email: { [Op.iLike]: r.payload.email }	},
		include: [{
			model: Wallet,
			as: 'wallet',
			required: false
		}]
	});
	const userController = new UserController(user);

	await userController
		.checkPassword(r.payload.password)

	if (userController.user.isTOTPEnabled()) {
		userController
			.checkTotpConfirmationCode(r.payload.totp)
	}

	const session = await Session.create({
		userId: user.id,
		invalidating: false,
		place: getGeo(r),
		ip: getRealIp(r),
		device: getDevice(r),
	});

	const result = {
		...generateJwt({ id: session.id }),
		userStatus: user.status,
		address: user.wallet ?
			user.wallet.address :
			null
	};

	return output(result);
}

export async function refreshTokens(r) {
	const newSession = await Session.create({
		userId: r.auth.credentials.id,
		invalidating: false,
		place: getGeo(r),
		ip: getRealIp(r),
		device: getDevice(r),
	});

	const result = {
		...generateJwt({ id: newSession.id }),
		userStatus: r.auth.credentials.status,
	};

	return output(result);
}

export async function logout(r) {
	await Session.update({
		invalidating: true,
		logoutAt: Date.now(),
	}, {
		where: { id: r.auth.artifacts.sessionId }
	});

	return output();
}

export async function registerWallet(r) {
	const { id } = r.auth.credentials;
	const { publicKey, address } = r.payload;

	const [_, isCreated] = await Wallet.findOrCreate({
		where: {
			[Op.or]: {
				userId: id,
				publicKey,
				address
			}
		},
		defaults: {
			userId: id,
			publicKey,
			address
		}
	});

	if (!isCreated) {
		return error(Errors.WalletExists, 'Wallet already exists', {});
	}

	const bech32Address = converter('eth').toBech32(address);

	return output({
		address,
		bech32Address
	});
}

export async function loginWallet(r) {
	const { signature, publicKey } = r.payload;

	const wallet = await Wallet.findOne({
		where: { publicKey },
		include: [{
			model: User,
			as: 'user'
		}]
	});

	if (!wallet) {
		return error(Errors.NotFound, 'Wallet not found', { field: ['publicKey'] });
	}

	const decryptedSignAddress = r.server.app.web3.eth.accounts.recover(wallet.publicKey, signature);

	if (wallet.address !== decryptedSignAddress) {
		return error(Errors.NotFound, 'Wallet not found', {})
	}

	const session = await Session.create({
		userId: wallet.user.id,
		invalidating: false,
		place: getGeo(r),
		ip: getRealIp(r),
		device: getDevice(r),
	});

	const result = {
		...generateJwt({ id: session.id }),
		userStatus: wallet.user.status,
		address: wallet.address
	};

	return output(result);
}
