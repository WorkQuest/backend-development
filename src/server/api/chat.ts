import { User, UserRole } from "../models/User";
import { Quest, QuestStatus } from "../models/Quest";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { server } from "../index";

export async function chatTest(r) {
  r.server.publish(
    "/api/chat/create",
    "Coooooolllll"
  );
  return "Test";
}
