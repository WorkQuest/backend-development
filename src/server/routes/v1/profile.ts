import * as Joi from "joi";
import { getMe, setRole } from "../../api/profile";
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import { userRoleSchema, userSchema } from '../../schemes/user';

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
}];
