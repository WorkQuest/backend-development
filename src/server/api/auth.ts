import { User, UserStatus } from "../models/User";
import { Op } from "sequelize";
import { error, getRandomHexToken, output } from "../utils";
import { Errors } from "../utils/errors";
import { addSendEmailJob } from "../jobs/sendEmail";
import config from "../config/config";
import { Session } from "../models/Session";
import { generateJwt } from "../utils/auth";

export async function register(r) {
	const emailUsed = await User.findOne({ where: { email: { [Op.iLike]: r.payload.email } } });
	if (emailUsed) return error(Errors.InvalidPayload, "Email used", [{ field: "email", reason: "used" }]);

	const emailConfirmCode = getRandomHexToken();
	await addSendEmailJob({
		email: r.payload.email,
		subject: "Work Quest | Confirmation code",
		text: `Your confirmation code is ${emailConfirmCode}. Follow this link ${config.baseUrl}/confirm?token=${emailConfirmCode}`,
		html: `Your confirmation code is ${emailConfirmCode}. Follow this link ${config.baseUrl}/confirm?token=${emailConfirmCode}`
	});
	await User.create({
		email: r.payload.email.toLowerCase(),
		password: r.payload.password,
		firstName: r.payload.firstName,
		lastName: r.payload.lastName,
		settings: {
			emailConfirm: emailConfirmCode
		}
	});

	return output();
}

export async function confirmEmail(r) {
	let user = await User.scope("withPassword").findOne({
		where: {
			"settings.emailConfirm": r.payload.confirmCode
		}
	});
	if (!user) return output();

	await user.update({ status: UserStatus.Confirmed, "settings.emailConfirm": null, role: r.payload.role });
	return output();
}

export async function login(r) {
	let user = await User.scope("withPassword").findOne({
		where: {
			email: {
				[Op.iLike]: r.payload.email
			}
		}
	});
	if (!user) return error(Errors.NotFound, "User not found", {});
	if (!(await user.passwordCompare(r.payload.password))) return error(Errors.NotFound, "User not found", {});
	if (user.status !== UserStatus.Confirmed) return error(Errors.UnconfirmedUser, "Unconfirmed user", {});
	if (user.role !== r.payload.role) return error(Errors.InvalidPayload, "You cannot login using another role", [{
		field: "role",
		reason: "invalid"
	}]);

	const session = await Session.create({
		userId: user.id
	});

	return output(generateJwt({ id: session.id }));
}
