import * as Joi from "joi";
import * as handlers from "../../api/profile";
import { UserRole } from "@workquest/database-models/lib/models";
import {
  accountAddressSchema,
  employerQuerySchema,
  emptyOkSchema,
  idSchema,
  limitSchema,
  locationFullSchema,
  offsetSchema,
  outputOkSchema,
  outputPaginationSchema,
  phoneSchema,
  prioritySchema,
  searchSchema,
  specializationKeysSchema,
  totpSchema,
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema,
  userEmployersSchema,
  userFirstNameSchema,
  userLastNameSchema,
  userMeSchema,
  userPasswordSchema,
  userRaiseViewDurationSchema,
  userRaiseViewSchema,
  userRaiseViewTypeSchema,
  userRoleSchema,
  userSchema,
  userStatisticsSchema,
  userWorkersSchema,
  workerPayloadSchema,
  workerQuerySchema,
  payPeriodSchema,
  workPlaceSchema,
  workerCostPerHourSchema,
  workerQueryForMapPointsSchema,
  workerProfileVisibilitySettingsSchema,
  employerProfileVisibilitySettingsSchema,
} from "@workquest/database-models/lib/schemes";

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
      schema: outputOkSchema(userMeSchema).label("GetMeResponse")
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
  method: 'GET',
  path: '/v1/profile/wallet/{address}',
  handler: handlers.getUserByWallet,
  options: {
    auth: 'jwt-access',
    id: 'v1.profile.getUserByWallet',
    tags: ['api', 'profile'],
    description: 'Get user profile by wallet address',
    validate: {
      params: Joi.object({
        address: accountAddressSchema.required()
      }).label('GetUserByWalletParams')
    },
    response: {
      schema: outputOkSchema(userSchema).label('GetUserByWalletResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/profile/worker/map/points",
  handler: handlers.getUsers(UserRole.Worker, 'points'),
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getWorkerPoints",
    tags: ["api", "profile"],
    description: "Get worker points",
    validate: {
      query: workerQueryForMapPointsSchema,
    },
    response: {
      schema: outputOkSchema(userWorkersSchema).label("GetWorkerPointsResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/profile/employers",
  handler: handlers.getUsers(UserRole.Employer, 'list'),
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
  path: "/v1/profile/users",
  handler: handlers.getAllUsers,
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getAllUsers",
    tags: ["api", "profile"],
    description: "Get all users (workers and employers)",
    validate: {
      query: Joi.object({
        q: searchSchema,
        walletRequired: Joi.boolean().default(false),
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAllUsersQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label("GetAllUsersResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/dao/profile/users",
  handler: handlers.getAllUsersDao,
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getAllUsersDao",
    tags: ["api", "profile"],
    description: "Get all users (workers and employers)",
    validate: {
      query: Joi.object({
        q: searchSchema,
        walletRequired: Joi.boolean().default(false),
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAllUsersDaoQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label("GetAllUsersDaoResponse")
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
        totpCode: totpSchema,
        profile: Joi.object({
          avatarId: idSchema.allow(null).required(),
          firstName: userFirstNameSchema.required(),
          lastName: userLastNameSchema.required(),
          phoneNumber: phoneSchema.allow(null).required(),
          locationFull: locationFullSchema.allow(null).required(),
          additionalInfo: userAdditionalInfoEmployerSchema.required(),
          profileVisibility: employerProfileVisibilitySettingsSchema.required(),
        }).required().label('EditEmployerProfile'),
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
        totpCode: totpSchema,
        profile: Joi.object({
          lastName: userLastNameSchema.required(),
          firstName: userFirstNameSchema.required(),
          avatarId: idSchema.allow(null).required(),
          phoneNumber: phoneSchema.allow(null).required(),
          priority: prioritySchema.allow(null).required(),
          locationFull: locationFullSchema.allow(null).required(),
          workplace: workPlaceSchema.allow(null).required(),
          payPeriod: payPeriodSchema.allow(null).required(),
          additionalInfo: userAdditionalInfoWorkerSchema.required(),
          costPerHour: workerCostPerHourSchema.allow(null).required(),
          specializationKeys: specializationKeysSchema.required().unique(),
          profileVisibility: workerProfileVisibilitySettingsSchema.required(),
        }).required().label('EditWorkerProfile'),
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
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/profile/statistic/me",
  handler: handlers.getUserStatistics,
  options: {
    auth: 'jwt-access',
    id: "v1.profile.getUserStatistic",
    tags: ["api", "profile"],
    description: "Get all statistic about current user",
    response: {
      schema: outputOkSchema(userStatisticsSchema).label("GetUserStatisticsResponse")
    }
  }
}, {
  method: 'PUT',
  path: '/v1/profile/change-role',
  handler: handlers.changeUserRole,
  options: {
    description: 'Change user role',
    auth: 'jwt-access',
    tags: ['api', 'profile'],
    validate: {
      payload: Joi.object({
        totp: totpSchema.required()
      }).label('ChangeUserRolePayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/profile/worker/me/raise-view/pay",
  handler: handlers.payForMyRaiseView,
  options: {
    auth: 'jwt-access',
    id: "v1.profile.raiseView.pay",
    tags: ["api", "profile"],
    description: "Pay for user raise view",
    validate: {
      payload: Joi.object({
        duration: userRaiseViewDurationSchema.required(),
        type: userRaiseViewTypeSchema.required(),
      }).label("UserRaiseViewSelectPayload")
    },
    response: {
      schema: outputOkSchema(userRaiseViewSchema).label("UserPayRaiseViewPayResponse"),
    },
  },
}, {
  method: "POST",
  path: "/v1/profile/get-workers",
  handler: handlers.getUsers(UserRole.Worker,'list'),
  options: {
    auth: 'jwt-access',
    id: "v1.getWorkersBySpecialisation",
    tags: ["api", "profile"],
    description: "Get workers with specialization",
    validate: {
      query: workerQuerySchema,
      payload: workerPayloadSchema,
    },
    response: {
      schema: outputOkSchema(userWorkersSchema).label("GetWorkersResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/profile/workers/map/get-points",
  handler: handlers.getUsers(UserRole.Worker,'points'),
  options: {
    auth: 'jwt-access',
    id: "v1.getWorkersMapPointsBySpecialisation",
    tags: ["api", "profile"],
    description: "Get workers map points with specialization",
    validate: {
      query: workerQuerySchema,
      payload: workerPayloadSchema,
    },
    response: {
      schema: outputOkSchema(userWorkersSchema).label("GetWorkersMapPointsResponse")
    },
  }
}, {
  method: "DELETE",
  path: "/v1/profile",
  handler: handlers.deleteProfile,
  options: {
    auth: 'jwt-access',
    id: "v1.deleteProfile",
    tags: ["api", "profile"],
    description: "Delete profile",
    validation: {
      payload: Joi.object({
        totp: totpSchema.required(),
      }).required().label('DeleteProfilePayload')
    },
    response: {
      schema: emptyOkSchema,
    },
  }
}];
