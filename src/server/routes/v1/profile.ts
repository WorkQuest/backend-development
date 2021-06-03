import * as Joi from "joi";
import { getMe, setAvatar } from '../../api/profile';
import { emptyOkSchema, outputOkSchema } from '../../schemes';
import { userSchema } from "../../schemes/user";
import { mediaIdSchema } from '../../schemes/media';

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
        mediaId: mediaIdSchema.allow(null).required(),
      }).label('SetAvatarPayload')
    },
    response: {
      schema: emptyOkSchema.label('ProfileSetAvatarResponse')
    }
  }
}];
