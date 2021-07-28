import { News } from "../models/News";
import { error, output } from "../utils";
import { server } from "../index";
import { Media } from "../models/Media";
import { Chat } from "../models/Chat";

export async function chatTest(r) {
  try {
    const timePoll = new Date()
    server.publish('/chat/create/', {
      createdAt: timePoll.toString()
    });
    return timePoll
  } catch (e) {
    console.log("deleteNews", e);
    return error(500000, "Internal server error", {});
  }
}

export async function createChat(r) {
  try {
  //   const media: any = await Chat.findOne({
  //     where: {
  //       userId: r.auth.credentials.id,
  //       checkNews: false
  //     }
  //   });
  //   if (media) {
  //     return error(404000, "File not found", null);
  //   }
  //   const create: any = await Media.create({
  //     userId: r.payload.file.userId,
  //     contentType: r.payload.file.contentType,
  //     url: r.payload.file.url,
  //     hash: r.payload.file.hash
  //   });
  //   const id: any = create.id;
    return output ();
  } catch (err) {
    console.log("createFile", err);
    return error(500000, "Internal Server Error", null);
  }
};
