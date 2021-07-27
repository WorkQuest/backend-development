import { News } from "../models/News";
import { error, output } from "../utils";
import { server } from "../index";

export async function chatTest(r) {
  try {
    console.log('YA TYT, YA PRISHEL');
    const timePoll = new Date()
    r.server.publish('/chat/create/', {
      createdAt: timePoll.toString()
    });
  } catch (e) {
    console.log("deleteNews", e);
    return error(500000, "Internal server error", {});
  }
}
