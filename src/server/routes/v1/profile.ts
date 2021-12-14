import * as Joi from "joi";
import * as handlers from "../../api/profile";
import { UserRole } from "@workquest/database-models/lib/models";
import {
  idSchema,
  userSchema,
  emptyOkSchema,
  outputOkSchema,
  locationSchema,
  userRoleSchema,
  workPlaceSchema,
  userWorkersSchema,
  mobilePhoneSchema,
  workerQuerySchema,
  userLastNameSchema,
  userPasswordSchema,
  employerQuerySchema,
  userEmployersSchema,
  userFirstNameSchema,
  workerWagePerHourSchema,
  specializationKeysSchema,
  userAdditionalInfoWorkerSchema,
  userAdditionalInfoEmployerSchema, prioritySchema, limitSchema, offsetSchema, outputPaginationSchema
} from "@workquest/database-models/lib/schemes";
import { getAllUsers } from "../../api/profile";

export default [{
  method: "GET",
  path: "/v1/profile/me",
  handler: handlers.getMe,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.getUser,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.getUsers(UserRole.Employer),
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getEmployers",
    tags: ["api", "profile"],
    description: "Get employers",
    validate: {
      query: employerQuerySchema,
    },
    response: {
      schema: outputOkSchema(userEmployersSchema).label("GetEmployersResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/profile/workers",
  handler: handlers.getUsers(UserRole.Worker),
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getWorkers",
    tags: ["api", "profile"],
    description: "Get workers",
    validate: {
      query: workerQuerySchema,
    },
    response: {
      schema: outputOkSchema(userWorkersSchema).label("GetWorkersResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/profile/users",
  handler: handlers.getAllUsers,
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getUsers",
    tags: ["api", "profile"],
    description: "Get users",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUsersQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label("GetWorkersResponse")
    },
  }
}, {
  method: "PUT",
  path: "/v1/employer/profile/edit",
  handler: handlers.editProfile(UserRole.Employer),
  options: {
    auth: 'jwt-access',
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
  handler: handlers.editProfile(UserRole.Worker),
  options: {
    auth: 'jwt-access',
    id: "v1.profile.editWorker",
    tags: ["api", "profile"],
    description: "Edit worker profile",
    validate: {
      payload: Joi.object({
        lastName: userLastNameSchema.required(),
        firstName: userFirstNameSchema.required(),
        avatarId: idSchema.allow(null).required(),
        priority: prioritySchema.allow(null).required(),
        location: locationSchema.allow(null).required(),
        workplace: workPlaceSchema.allow(null).required(),
        additionalInfo: userAdditionalInfoWorkerSchema.required(),
        wagePerHour: workerWagePerHourSchema.allow(null).required(),
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
  handler: handlers.setRole,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.changePassword,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.confirmPhoneNumber,
  options: {
    auth: 'jwt-access',
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
  handler: handlers.sendCodeOnPhoneNumber,
  options: {
    auth: 'jwt-access',
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

