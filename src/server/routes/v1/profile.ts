import * as Joi from "joi";
import { editProfile, getMe, setRole } from '../../api/profile';
import { emptyOkSchema, outputOkSchema, idSchema } from '../../schemes';
import {
  additionalInfoEmployerSchema,
  additionalInfoWorkerSchema, firstNameSchema, lastNameSchema,
  userRoleSchema,
  userSchema
} from '../../schemes/user';

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
      }).label('SetUserRolePayload')
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
    id: "v1.profile.worker.edit",
    validate: {
      payload: Joi.object({
        mediaId: idSchema.allow(null).required().label('MediaId'),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        additionalInfo: Joi.alternatives(
          additionalInfoEmployerSchema.options({presence: 'required'}),
          additionalInfoWorkerSchema.options({presence: 'required'})
        ).required(),
      }).label('EditProfilePayload')
    },
    response: {
      schema: outputOkSchema(userSchema).label("EditProfileResponse")
    }
  }
}];

