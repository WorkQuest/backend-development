import * as Joi from "joi";
import {
  changePassword,
  confirmPhoneNumber,
  editProfile,
  editProfiles,
  getMe,
  getUser,
  setRole,
  sendCodeOnPhoneNumber, getUsers
} from "../../api/profile";
import {
  employerQuerySchema,
  emptyOkSchema,
  idSchema,
  locationSchema,
  mobilePhoneSchema,
  outputOkSchema,
  skillFilterSchema,
  userAdditionalInfoEmployerSchema,
  userAdditionalInfoWorkerSchema,
  userFirstNameSchema,
  userLastNameSchema,
  userPasswordSchema,
  userRoleSchema,
  userSchema,
  userShortSchema
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
  handler: editProfiles,
  options: {
    id: "v1.profile.edit",
    tags: ["api", "profile"],
    description: "Edit profile information (old)",
    validate: {
      payload: Joi.object({
        avatarId: idSchema.allow(null).required(),
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        location: locationSchema.allow(null).required(),
        skillFilters: skillFilterSchema.allow(null).required(),
        additionalInfo: Joi.alternatives(
          userAdditionalInfoEmployerSchema.options({ presence: "required" }),
          userAdditionalInfoWorkerSchema.options({ presence: "required" })
        ).required(),
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
        phoneNumber: mobilePhoneSchema.required(),
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
}, {
  method: "PUT",
  path: "/v1/profile/employer/edit",
  handler: editProfile(UserRole.Employer),
  options: {
      id: "v1.employer.profile.edit",
      tags: ["api", "profile"],
      description: "Edit employer profile information",
      validate: {
        payload: Joi.object({
          avatarId: idSchema.allow(null).required(),
          firstName: userFirstNameSchema.required(),
          lastName: userLastNameSchema.required(),
          location: locationSchema.allow(null).required(),
          skillFilters: skillFilterSchema.allow(null).required(),
          additionalInfo: userAdditionalInfoEmployerSchema.required(),
        }).label("EditEmployerProfilePayload")
      },
      response: {
        schema: outputOkSchema(userSchema).label("UserResponse")
      }
    }
}, {
  method: "PUT",
  path: "/v1/profile/worker/edit",
  handler: editProfile(UserRole.Worker),
  options: {
    id: "v1.worker.profile.edit",
    tags: ["api", "profile"],
    description: "Edit worker profile information",
    validate: {
      payload: Joi.object({
        avatarId: idSchema.allow(null).required(),
        firstName: userFirstNameSchema.required(),
        lastName: userLastNameSchema.required(),
        location: locationSchema.allow(null).required(),
        skillFilters: skillFilterSchema.allow(null).required(),
        additionalInfo: userAdditionalInfoWorkerSchema.required(),
      }).label("EditWorkerProfilePayload")
    },
    response: {
      schema: outputOkSchema(userSchema).label("UserResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/employers/get",
  handler: getUsers(UserRole.Employer),
  options: {
    id: "v1.getEmployers",
    tags: ["api", "profile"],
    description: "Get employers with filters",
    validate: {
      query: employerQuerySchema,
      payload: Joi.object({
        location: Joi.object({
          north: locationSchema,
          south: locationSchema,
        }).label('GetEmployerLocation'),
      }).label('GetEmployersPayload'),
    },
    response: {
      schema: outputOkSchema(userShortSchema).label("GetQuestsResponse")
    },
  }
}, {
  method: "POST",
  path: "/v1/workers/get",
  handler: getUsers(UserRole.Worker),
  options: {
    id: "v1.getWorkers",
    tags: ["api", "profile"],
    description: "Get workers with filters",
    validate: {
      query: employerQuerySchema,
      payload: Joi.object({
        skillFilters: skillFilterSchema,
        location: Joi.object({
          north: locationSchema,
          south: locationSchema,
        }).label('GetWorkersLocation'),
      }).label('GetWorkersPayload'),
    },
    response: {
      schema: outputOkSchema(userShortSchema).label("GetQuestsResponse")
    },
  }
},];

