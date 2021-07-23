import { News } from "../models/News";
import { getUUID } from "../utils";
import { string } from "joi";
import { Op, where } from "sequelize";
import { User } from "../models/User";
import { error, output } from "../utils";
import { Files } from "../models/Files";
import { defaults } from "pg";
import { Quest, QuestStatus } from "../models/Quest";
import { Errors } from "../utils/errors";
import { QuestsResponse } from "../models/QuestsResponse";
import { fileIdSchema } from "../schemes/files";
import forums from "../routes/v1/forums";


export async function creatNewsForum(r) {
  try {
    const createNews = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.payload.idAuthor,
        checkNews: true,
        text: r.payload.text
      }
    });
    if (!createNews) {
      return "Error creat news";
    }
    return "Ok news creat";
  } catch (e) {
    return false;
  }
}


export async function creatCommentForum(r) {
  try {
    const [create] = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.payload.idAuthor,
        text: r.payload.text,
        checkNews: false
      }
    });
    if (!create) {
      return "Comment not create";
    }
    const findNews: any = await News.findOne({
      where: {
        id: r.payload.idNews
      }
    });
    let arr = [...findNews.answers];
    arr.push(create.id);
    await findNews.update({
      answers: arr
    });
    return "Ok";
  } catch (e) {
    return false;
  }
}


export async function likesCreate(r) {
  try {
    const createLike: any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!createLike) {
      return "News not found";
    }
    let arr = [...createLike.likes];
    arr.push(r.payload.idUser);
    await createLike.update({
      likes: arr
    });

    return "OK";
  } catch (e) {
    return false;
  }

}


export async function deleteNews(r) {
  try {
    const deleteNews = await News.destroy({
      where: {
        id: r.payload.id
      }
    });
    if (!deleteNews) {
      return "Not find news";
    }
    return "Ok news delete";
  } catch (e) {
    return false;
  }
}


export async function deleteComment(r) {
  try {
    const deleteComment = await News.destroy({
      where: {
        id: r.payload.id
      }
    });
    if (!deleteComment) {
      return "Not found comment";
    }
    const deleteAnswerComment = await News.findOne({
      where: {
        answers: {
          [Op.contains]: [
            r.payload.id
          ]
        }
      }
    });
    deleteAnswerComment.answers = deleteAnswerComment.answers.filter((n) => {
      return n != r.payload.id;
    });
    await deleteAnswerComment.update({ answers: deleteAnswerComment.answers });
    if (!deleteAnswerComment) {
      return "Not found comment";
    }
    return "Ok news delete";
  } catch (e) {
    return false;
  }
}

export async function findUserInfo(r) {
  try {
    const findUser: any = await User.findAll({
      where: {
        id: r.payload.id
      },
      include: [{ model: News, as: "baseNews", attributes: ["id", "text"] }]
    });
    if (!findUser) {
      return "Not find user";
    }
    return findUser;
  } catch (e) {
    return false;
  }
}


export const createFile = async (r) => {
  try {
    const file: any = await Files.findOne({
      where: {
        idUser: r.auth.credentials.id,
        url: r.payload.file.url
      }
    });
    if (file) {
      return error(404000, "File not found", null);
    }
    const create: any = await Files.create({
      idUser: r.payload.file.idUser,
      contentType: r.payload.file.contentType,
      url: r.payload.file.url,
      hash: r.payload.file.hash
    });
    const id: any = create.id;
    return output({ id });
  } catch (err) {
    throw error(500000, "Internal Server Error", null);
  }
};


export async function deleteFile(r) {
  await Files.destroy({
    where: {
      id: r.params.idFile
    }
  });
  return output();
}


export async function getFiles(r) {
  try {
    const { offset, limit } = r.query;
    const file = await Files.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        idUser: r.auth.credentials.id
      },
      attributes: ["id", "contentType", "url", "hash", "createdAt", "updatedAt"]
    });
    if (!file) {
      return error(404000, "Not found", null);
    }
    return output(file);
  } catch (err) {
    throw error(500000, "Internal Server Error", null);
  }
  return output();
}


