import { error, output } from "../utils";
import { server } from "../index";
import { Chat } from "../models/Chat";
import { Op } from "sequelize";
import { Media } from "../models/Media";
import { findNewsAll } from "./forums";

export async function chatTest(r) {
  try {
    const timePoll = new Date();
    server.publish("/chat/create/", {
      createdAt: timePoll.toString()
    });
    return timePoll;
  } catch (e) {
    console.log("deleteNews", e);
    return error(500000, "Internal server error", {});
  }
}

export async function createChat(r) {
  try {
    const userId = r.auth.credentials.id;
    for (let i = 0; i < r.payload.membersId.length; i++) {
      if (r.payload.membersId[i] !== userId) {
      }
    }
    if (r.payload.isPrivate === true){
      const chat: any = await Chat.findOne({
        where: {
          membersId: {
            [Op.eq]: r.payload.membersId
          }
        }
      });
      if (chat) {
        return error(400000, "Bad request, chat exist", null);
      }
    }
    const create: any = await Chat.create({
      userId: r.auth.credentials.id,
      membersId: r.payload.membersId,
      isPrivate: r.payload.isPrivate
    });
    const id: any = create.id;
    return output (id);
  } catch (err) {
    return error(500000, "Internal Server Error", null);
  }
};

export async function getChats(r) {
  try {
    const { offset, limit } = r.query;
    const chats = await Chat.findAndCountAll({
      limit: limit,
      offset: offset,
      // include: { //TODO create find last message
      //   model:
      //   as: 'ChatInfo',
      // },
      where: {
        membersId: {
          [Op.contains]: r.auth.credentials.id
        },
      },
      attributes: ["id"]
    });
    if (!chats) {
      return error(404000, "Not found", null);
    }
    return output(chats);
  } catch (err) {
    console.log("getFiles", err);
    return error(500000, "Internal Server Error", null);
  }
}
