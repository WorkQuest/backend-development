import * as Joi from "joi";
import {
  changePassword,
  confirmPhoneNumber,
  editProfile,
  getMe,
  sendCodeOnPhoneNumber,
  setRole
} from '../../api/profile';
import { emptyOkSchema, idSchema, outputOkSchema } from "../../schemes";
import {
  additionalInfoEmployerSchema,
  additionalInfoWorkerSchema,
  firstNameSchema,
  lastNameSchema,
  passwordSchema,
  userRoleSchema,
  userSchema
} from "../../schemes/user";

export default [{
  method: "GET",
  path: "/v1/profile/me",
  handler: getMe,
  options: {
    id: "v1.profile.getMe",
    tags: ["api", "profile"],
    description: "Get info about current user",
    response: {
      schema: outputOkSchema(userSchema).label("ProfileGetMeResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/profile/set-role",
  handler: setRole,
  options: {
    id: "v1.profile.setRole",
    tags: ["api", "profile"],
    description: "Set role user (Only for need set role)",
    validate: {
      payload: Joi.object({
        role: userRoleSchema.required()
      }).label("SetUserRolePayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "PUT",
  path: "/v1/profile/edit",
  handler: editProfile,
  options: {
    id: "v1.profile.edit",
    tags: ["api", "profile"],
    description: "Edit profile information",
    validate: {
      payload: Joi.object({
        avatarId: idSchema.allow(null).required().label("MediaId"),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        additionalInfo: Joi.alternatives(
          additionalInfoEmployerSchema.options({ presence: "required" }),
          additionalInfoWorkerSchema.options({ presence: "required" })
        ).required()
      }).label("EditProfilePayload")
    },
    response: {
      schema: outputOkSchema(userSchema).label("EditProfileResponse")
    }
  }
}, {
  method: "PUT",
  path: "/v1/profile/change-password",
  handler: changePassword,
  options: {
    id: "v1.profile.changePassword",
    tags: ["api", "profile"],
    description: "Change user password",
    validate: {
      payload: Joi.object({
        oldPassword: passwordSchema.required(),
        newPassword: passwordSchema.required()
      }).label("ChangePasswordPayload")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/profile/phone/confirm",
  handler: confirmPhoneNumber,
  options: {
    id: "v1.profile.phone.confirm",
    tags: ["api", "profile"],
    description: "Confirm phone number",
    validate: {
      payload: Joi.object({
        confirmCode: Joi.number().required().label('ConfirmCode')
      }).label('PhoneConfirmPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/profile/phone/send-code",
  handler: sendCodeOnPhoneNumber,
  options: {
    id: "v1.profile.phone.sendCode",
    tags: ["api", "profile"],
    description: "Send code for confirm phone number",
    validate: {
      payload: Joi.object({
        phoneNumber: Joi.string().required().label('PhoneNumber'),
      }).label('PhoneSendCodePayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];

