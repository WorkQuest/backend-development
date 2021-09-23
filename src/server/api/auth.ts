import * as path from "path";
import * as fs from "fs";
import * as querystring from "querystring";
import Handlebars = require("handlebars");
import { Op } from "sequelize";
import config from "../config/config";
import { Errors } from "../utils/errors";
import { error, getDevice, getGeo, getRandomHexToken, getRealIp, output } from "../utils";
import { addSendEmailJob } from "../jobs/sendEmail";
import { generateJwt } from "../utils/auth";
import { Session,
	defaultUserSettings,
	getDefaultAdditionalInfo,
	User,
	UserStatus,
	RatingStatistic
} from "@workquest/database-models/lib/models";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "confirmEmail.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
	encoding: "utf-8"
}));

async function getUserByNetworkProfile(network: string, profile): Promise<User> {
	const foundUserBySocialId = await User.findWithSocialId(network, profile.id);

	if (foundUserBySocialId) {
		return foundUserBySocialId;
	}

	const foundUserByEmail = await User.findWithEmail(profile.email);
	const socialInfo = {
		id: profile.id,
		email: profile.email,
		last_name: profile.name.last,
		first_name: profile.name.first,
	};

	if (foundUserByEmail) {
		await foundUserByEmail.update({ [`settings.social.${network}`]: socialInfo });

		return foundUserByEmail;
	}

	const user = await User.create({
		email: profile.email.toLowerCase(),
		password: null,
		firstName: profile.name.first,
		lastName: profile.name.last,
		status: UserStatus.NeedSetRole,
		settings: Object.assign({}, defaultUserSettings, {
			social: {
				[network]: socialInfo,
			}
		})
	});
	await RatingStatistic.create({ userId: user.id });

	return user;
}

export async function register(r) {
	const emailUsed = await User.findOne({ where: { email: { [Op.iLike]: r.payload.email } } });
	if (emailUsed) return error(Errors.InvalidPayload, "Email used", [{ field: "email", reason: "used" }]);

	const emailConfirmCode = getRandomHexToken().substring(0, 6).toUpperCase();
	const emailConfirmLink = `${config.baseUrl}/confirm?token=${emailConfirmCode}`;
	const emailHtml = confirmTemplate({ confirmLink: emailConfirmLink, confirmCode: emailConfirmCode });

	await addSendEmailJob({
		email: r.payload.email,
		subject: "Work Quest | Confirmation code",
		text: `Your confirmation code is ${emailConfirmCode}. Follow this link ${config.baseUrl}/confirm?token=${emailConfirmCode}`,
		html: emailHtml
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

	const session = await Session.create({ userId: user.id, invalidating: false, place: getGeo(r), ip: getRealIp(r), device: getDevice(r) });
	const result = {
		...generateJwt({ id: session.id }),
		userStatus: user.status,
	};

	return output(result);
}

export function getLoginViaSocialNetworkHandler(returnType: "token" | "redirect") {
	return async function loginThroughSocialNetwork(r, h) {
		const profile = r.auth.credentials.profile;

		if (!profile.email) {
			return error(Errors.InvalidEmail, "Field email was not returned", {});
		}

		const user = await getUserByNetworkProfile(r.auth.strategy, profile);
		const session = await Session.create({
			userId: user.id,
			invalidating: false,
			place: getGeo(r),
			ip: getRealIp(r),
			device: getDevice(r)
		});
		const result = {
			...generateJwt({ id: session.id }),
			userStatus: user.status
		};
		if (returnType === "redirect") {
			const qs = querystring.stringify(result);
			return h.redirect(config.baseUrl + "/sign-in?" + qs);
		}
		return output(result);
	};
}

export async function confirmEmail(r) {
	const user = await User.scope("withPassword").findByPk(r.auth.credentials.id);

	if (!user.settings.emailConfirm)
		return error(Errors.UserAlreadyConfirmed, "User already confirmed", {});
	if (user.settings.emailConfirm.toLowerCase() !== r.payload.confirmCode.toLowerCase())
		return error(Errors.InvalidPayload, "Invalid confirmation code", [{ field: "confirmCode", reason: "invalid" }]);
	// If user sets role on confirm
	if (r.payload.role) {
		await user.update({
			status: UserStatus.Confirmed,
			"settings.emailConfirm": null,
			role: r.payload.role,
			additionalInfo: getDefaultAdditionalInfo(r.payload.role)
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
		where: {
			email: {
				[Op.iLike]: r.payload.email
			}
		}
	});

	if (!user) return error(Errors.NotFound, "User not found", {});
	if (!(await user.passwordCompare(r.payload.password))) return error(Errors.NotFound, "User not found", {});
	if (user.isTOTPEnabled()) {
		user.validateTOTP(r.payload.totp);
	}


	const session = await Session.create({
		userId: user.id,
		invalidating: false,
		place: getGeo(r),
		ip: getRealIp(r),
		device: getDevice(r)
	});

	const result = {
		...generateJwt({ id: session.id }),
		userStatus: user.status,
	};

	return output(result);
}

export async function refreshTokens(r) {
	const newSession = await Session.create({
		userId: r.auth.credentials.id,
		invalidating: false,
		place: getGeo(r),
		ip: getRealIp(r),
		device: getDevice(r)
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
		where: {
			id: r.auth.artifacts.sessionId
		}
	});
	return output();
}

