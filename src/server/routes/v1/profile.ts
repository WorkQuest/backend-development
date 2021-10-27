import * as Joi from "joi";
import {
  getMe,
  getUser,
  setRole,
  getUsers,
  editProfile,
  changePassword,
  confirmPhoneNumber,
  sendCodeOnPhoneNumber,
} from "../../api/profile";
import {
  idSchema,
  userSchema,
  emptyOkSchema,
  outputOkSchema,
  locationSchema,
  userRoleSchema,
  userQuerySchema,
  userWorkersSchema,
  mobilePhoneSchema,
  userLastNameSchema,
  userPasswordSchema,
  userEmployersSchema,
  userFirstNameSchema,
  specializationKeysSchema,
  userAdditionalInfoWorkerSchema,
  userAdditionalInfoEmployerSchema,
} from "@workquest/database-models/lib/schemes";
import { UserRole } from "@workquest/database-models/lib/models";

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
}, {
  method: "GET",
  path: "/v1/profile/employers",
  handler: getUsers(UserRole.Employer),
  options: {
    id: "v1.profile.getEmployers",
    tags: ["api", "profile"],
    description: "Get employers",
    validate: {
      query: userQuerySchema,
    },
    response: {
      schema: outputOkSchema(userEmployersSchema).label("GetEmployersResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/profile/workers",
  handler: getUsers(UserRole.Worker),
  options: {
    id: "v1.profile.getWorkers",
    tags: ["api", "profile"],
    description: "Get workers",
    validate: {
      query: userQuerySchema,
    },
    response: {
      schema: outputOkSchema(userWorkersSchema).label("GetWorkersResponse")
    },
  }
}, {
  method: "PUT",
  path: "/v1/employer/profile/edit",
  handler: editProfile(UserRole.Employer),
  options: {
    id: "v1.profile.editEmployer",
    tags: ["api", "profile"],
    description: "Edit employer profile information",
    validate: {
      payload: Joi.object({
        avatarId: idSchema.allow(null).required(),
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        location: locationSchema.allow(null).required(),
        additionalInfo: userAdditionalInfoEmployerSchema.required(),
      }).label("EditEmployerProfilePayload")
    },
    response: {
      schema: outputOkSchema(userSchema).label("EditEmployerResponse")
    }
  }
}, {
  method: "PUT",
  path: "/v1/worker/profile/edit",
  handler: editProfile(UserRole.Worker),
  options: {
    id: "v1.profile.editWorker",
    tags: ["api", "profile"],
    description: "Edit worker profile",
    validate: {
      payload: Joi.object({
        avatarId: idSchema.allow(null).required(),
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        location: locationSchema.allow(null).required(),
        additionalInfo: userAdditionalInfoWorkerSchema.required(),
        specializationKeys: specializationKeysSchema.allow(null).required().unique(),
      }).label("EditWorkerProfilePayload")
    },
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
        phoneNumber: mobilePhoneSchema.required(),
      }).label('PhoneSendCodePayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];

