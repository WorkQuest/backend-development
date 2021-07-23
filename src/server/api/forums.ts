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


export async function createLikes(r) {
  try {
    const news: any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!news) {
      return error(404000, "Not found news", {});
    }
    let arr = [...news.likes];
    arr.push(r.auth.credentials.id);
    await news.update({
      likes: arr
    });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function deleteLike(r) {
  try {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        likes: {
          [Op.contains]: [
            r.auth.credentials.id
          ]
        }
      }
    });
    if (!deleteLike) {
      return error(404000, "Not found news", {});
    }
    news.likes = news.likes.filter((n) => {
      return n != r.auth.credentials.id;
    });
    await news.update({ likes: news.likes });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function deleteNews(r) {
  try {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        idAuthor: r.auth.credentials.id
      }
    });
    if (!news) {
      return error(404000, "Not found news", {});
    }
    await news.destroy();
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function deleteComment(r) {
  try {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        answers: {
          [Op.contains]: [
            r.payload.idComment
          ]
        }
      }
    });
    if (!news) {
      return error(404000, "Not found news", {});
    }
    const comment = await News.findOne({
      where: {
        id: r.payload.idComment,
        idAuthor: {
          [Op.or]: [r.auth.credentials.id, news.idAuthor]
        }
      }
    });
    if (!comment) {
      return error(404000, "Not found comment", {});
    }
    await comment.destroy();
    news.answers = news.answers.filter((n) => {
      return n != r.payload.idComment;
    });
    await news.update({ answers: news.answers });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function findNewsAll(r) {
  try {
    const object: any = {
      limit: r.query.limit,
      offset: r.query.offset,
      where: {
        checkNews: true
      }
    };
    if (!!!r.query.id) {
      object.where.id = r.query.id;
    }
    const news = await News.findAll(object);
    return output(news);
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export const createFile = async (r) => {
  try {
    const data: any = r.payload.file;
    const findFile: any = await News.findOne({
      where: {
        id: data.idNews
      }
    });
    if (!findFile) {
      return error(404000, "News not found", null);
    }
    if (findFile) {
      const compareFile: any = await Files.findAll({
        where: {
          idNews: data.idNews
        }
      });
      if (compareFile) {
        for (let i = 0; i < compareFile.length; i++) {
          if (compareFile[i].url === data.url) {
            return error(404000, "Early news exists", null);
          }
        }
      }
    }
    const addFile: any = await Files.create({
      idNews: data.idNews,
      contentType: data.contentType,
      url: data.url,
      hash: data.hash
    });
    if (!addFile) {
      return error(404000, "File not found", null);
    }
    return output({ addFile });
  } catch (err) {
    if (err.message == "This file type is now allowed") {
      return error(400000, "This file type is now allowed", null);
    }
    throw err;
  }
};


// export async function deleteFile(r) {
//   try {
//     const file = await Files.findByPk(r.params.idFile);
//     console.log(r.params.idFile);
//
//     if (!file) {
//       return error(Errors.NotFound, "Quest not found", {});
//     }
//     await Files.destroy({ where: { id: r.params.idFile } });
//   } catch (err) {
//     if (err.message == "This file type is now allowed") {
//       return error(400000, "This file type is now allowed", null);
//     }
//     throw err;
//   }
//   return output();
// }


export async function updateNewsAndComment(r) {
  try {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        idAuthor: r.auth.credentials.id
      }
    });
    if (!news) {
      return error(404000, "Not found news", {});
    }
    let objectUpdate: any = {
      text: r.payload.text
    };
    if (news.file != r.payload.file) {
      for (let i = 0; i < news.file.length; i++) {
        if (r.payload.file.indexOf(news.file[i]) != -1) {
          await Files.destroy({
            where: {
              id: news.file[i]
            }
          });
        }
      }
      objectUpdate.file = r.payload.file;
    }

    await news.update(objectUpdate);
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}

export async function createNews(r) {
  try {
    const news = await News.create({
      idAuthor: r.auth.credentials.id,
      checkNews: true,
      text: r.payload.text,
      file: r.payload.file
    });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function createComment(r) {
  try {
    const news: any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!news) {
      return error(404000, "Not found news", {});
    }
    const create = await News.create({
      idAuthor: r.auth.credentials.id,
      text: r.payload.text,
      checkNews: false
    });
    let arr = [...news.answers];
    arr.push(create.id);
    await news.update({
      answers: arr
    });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}
