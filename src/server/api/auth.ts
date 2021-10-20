import * as path from "path";
import * as fs from "fs";
import * as querystring from "querystring";
import Handlebars = require("handlebars");
import { Op } from "sequelize";
import config from "../config/config";
import { Errors } from "../utils/errors";
import { error, getRandomHexToken, output } from "../utils";
import { addSendEmailJob } from "../jobs/sendEmail";
import { generateJwt } from "../utils/auth";
import {
	User,
	Session,
	UserStatus,
	defaultUserSettings,
} from "@workquest/database-models/lib/models";
import { UserController } from "../controllers/user";

const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "templates", "confirmEmail.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
	encoding: "utf-8"
}));

export async function register(r) {
	const emailUsed = await User.findOne({ where: { email: { [Op.iLike]: r.payload.email } } });

	if (emailUsed) return error(Errors.InvalidPayload, "Email used", [{ field: "email", reason: "used" }]);

	const emailConfirmCode = getRandomHexToken().substring(0, 6).toUpperCase();
	console.log(emailConfirmCode);
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

	const session = await Session.create({ userId: user.id });
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

		const user = await UserController.getUserByNetworkProfile(r.auth.strategy, profile);
		const session = await Session.create({
			userId: user.id
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
		where: { email: { [Op.iLike]: r.payload.email }	}
	});

	if (!user) {
		return error(Errors.NotFound, "User not found", {});
	}

	const userController = new UserController(user.id, user);

	await userController.checkPassword(r.payload.password);

	if (user.isTOTPEnabled()) {
		await userController.checkTotpConfirmationCode(r.payload.totp);
	}

	const session = await Session.create({ userId: user.id	});

	const result = {
		...generateJwt({ id: session.id }),
		userStatus: user.status,
	};

	return output(result);
}

export async function refreshTokens(r) {
	const newSession = await Session.create({
		userId: r.auth.credentials.id
	});
	const result = {
		...generateJwt({ id: newSession.id }),
		userStatus: r.auth.credentials.status,
	};

	return output(result);
}
