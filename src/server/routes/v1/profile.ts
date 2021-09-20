import * as Joi from "joi";
import {
  changePassword,
  confirmPhoneNumber,
  editProfile,
  getMe,
  getUser,
  sendCodeOnPhoneNumber,
  setRole
} from "../../api/profile";
import {
  outputOkSchema,
  emptyOkSchema,
  idSchema,
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema,
  userFirstNameSchema,
  userLastNameSchema,
  userPasswordSchema,
  userRoleSchema,
  userSchema,
  skillFilterSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/profile/me",
  handler: getMe,
  options: {
    id: "v1.profile.getMe",
    tags: ["api", "profile"],
    description: "Get info about current user",
    response: {
      schema: outputOkSchema(userSchema).label("UserResponse")
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
        avatarId: idSchema.allow(null).required(),
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        skillFilters: skillFilterSchema,
        additionalInfo: Joi.alternatives(
          userAdditionalInfoEmployerSchema.options({ presence: "required" }),
          userAdditionalInfoWorkerSchema.options({ presence: "required" })
        ).required(),
        location: userLocationSchema,
      }).label("EditProfilePayload")
    },
    response: {
      schema: outputOkSchema(userSchema).label("UserResponse")
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
        oldPassword: userPasswordSchema.required(),
        newPassword: userPasswordSchema.required()
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
        confirmCode: Joi.number().min(100000).max(999999).required().label('ConfirmCode')
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
}, {
  method: "GET",
  path: "/v1/profile/{userId}",
  handler: getUser,
  options: {
    id: "v1.profile.getUser",
    tags: ["api", "profile"],
    description: "Get profile user",
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
    },
    response: {
      schema: outputOkSchema(userSchema).label("GetUserResponse")
    }
  }
}];

