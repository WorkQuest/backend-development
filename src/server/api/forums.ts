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
        idAuthor: r.auth.credentials.id,
        isNews: true,
        text: r.auth.credentials.text
      }
    });
    if (!createNews) {
      return error(400000,'News not create',{});
    }
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function createComment(r) {
  try {
    const [create] = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.auth.credentials.id,
        text: r.auth.credentials.text,
        isNews: false
      }
    });
    if (!create) {
      return error(400000,'News not create',{});
    }
    const findNews: any = await News.findOne({
      where: {
        id: r.auth.credentials.idNews
      }
    });
    let arr = [...findNews.answers];
    arr.push(create.id);
    await findNews.update({
      answers: arr
    });
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function createLikes(r) {
  try {
    const createLike: any = await News.findOne({
      where: {
        id: r.auth.credentials.idNews
      }
    });
    if (!createLike) {
      return error(404000,'Not found news',{});
    }
    let arr = [...createLike.likes];
    arr.push(r.auth.credentials.id);
    await createLike.update({
      likes: arr
    });
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteLike(r) {
  try {
    const deleteLike = await News.findOne({
      where: {
        id: r.auth.credentials.id,
        likes: {
          [Op.contains]: [
            r.auth.credentials.idUser
          ]
        }
      }
    });
    deleteLike.likes = deleteLike.likes.filter((n) => {
      return n != r.auth.credentialsidUser;
    });
    await deleteLike.update({ likes: deleteLike.likes });
    if (!deleteLike) {
      return error(404000,'Not found news',{});
    }
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteNews(r) {
  try {
    const checkOwner = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (String(checkOwner.idAuthor) === String(r.auth.credentials.id)) {
      const deleteNews = await News.destroy({
        where: {
          id: r.auth.credentials.id
        }
      });
      if (!deleteNews) {
        return error(404000,'Not found news',{});
      }
      return output({status: 'Success'})
    }
    return error(403000,'You not owner',{});
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteComment(r) {
  try {
    const checkOwner = await News.findOne({
      where: {
        id: r.payload.idNews
      }
    });
    if (!checkOwner) {
      return error(404000,'Not found news',{});
    }
    if (String(checkOwner.idAuthor) === String(r.auth.credentials.id)) {
      const deleteComment = await News.destroy({
        where: {
          id: r.payload.idComment
        }
      });
      if (!deleteComment) {
        return error(404000,'Not found comment',{});
      }
      const deleteAnswerComment = await News.findOne({
        where: {
          answers: {
            [Op.contains]: [
              r.payload.idComment
            ]
          }
        }
      });
      deleteAnswerComment.answers = deleteAnswerComment.answers.filter((n) => {
        return n != r.payload.idComment;
      });
      await deleteAnswerComment.update({ answers: deleteAnswerComment.answers });
      if (!deleteAnswerComment) {
        return error(404000,'Not found comment',{});
      }
      return output({status: 'Success'})
    }
    return error(403000,'You not owner',{});
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}

export async function userInformation(r) {
  try {
    const findUser: any = await User.findAll({
      where: {
        id: r.auth.credentials.id
      },
      include: [{ model: News, as: "baseNews", attributes: ["id", "text"] }]
    });
    if (!findUser) {
      return error(404000,'Not found user',{});
    }
    return findUser;
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function findNewsComments(r) {
  try {
    const findNews = await News.findOne({
      where: {
        id: r.auth.credentials.id
      }
    });
    if (!findNews) {
      return error(404000,'Not found news',{});
    }
    const findComment = await News.findAll({
      where: {
        id: { [Op.in]: findNews.answers }
      }
    });
    if (!findComment) {
      return error(404000,'Not found comment',{});
    }
    return findComment;
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function findNewsAll(r) {
  try {
    const findNewsAll = await News.findAll({});
    if (!findNewsAll) {
      return error(404000,'Not found news',{});
    }
    return findNewsAll;
  } catch (e) {
    console.log("ERROR", e);
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