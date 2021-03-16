import { getMe } from "../../api/profile";
import { outputOkSchema } from "../../schemes";
import { userSchema } from "../../schemes/user";

export default [{
  method: "GET",
  path: "/v1/profile/me",
  handler: getMe,
  options: {
    id: "v1.profile.getMe",
    tags: ["api", "auth"],
    description: "Get info about current user",
    response: {
      schema: outputOkSchema(userSchema).label("ProfileGetMeResponse")
    }
  }
}];
