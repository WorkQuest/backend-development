import { output } from "../utils";
import { User } from "../models/User";

export async function getMe(r) {
  return output(await User.findByPk(r.auth.credentials.id));
}
