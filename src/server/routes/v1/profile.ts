import * as Joi from "joi";
import { getMe, setAvatar, setRole } from '../../api/profile';
import { emptyOkSchema, outputOkSchema, idSchema } from '../../schemes';
import { userRoleSchema, userSchema } from "../../schemes/user";

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
  method: "PUT",
  path: "/v1/profile/set-avatar",
  handler: setAvatar,
  options: {
    id: "v1.profile.setAvatar",
    tags: ["api", "profile"],
    description: "Set avatar in profile",
    validate: {
      payload: Joi.object({
        mediaId: idSchema.allow(null).required().label('MediaId'),
      }).label('SetAvatarPayload')
    },
    response: {
      schema: emptyOkSchema
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
}];
