import * as Joi from "joi";
import { getMe, setAvatar } from '../../api/profile';
import { emptyOkSchema, idSchema, outputOkSchema } from '../../schemes';
import { userSchema } from "../../schemes/user";

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
}];
