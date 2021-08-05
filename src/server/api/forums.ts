import { News } from "../models/News";
import { Op } from "sequelize";
import { error, output } from "../utils";
import { Media } from "../models/Media";
import { Errors } from "../utils/errors";
import { LikesNews } from "../models/LikesNews";


export async function like(r) {
    const news = await News.findByPk(r.payload.idNews);
    if (!news) {
      return error(Errors.NotFound, "News not found", {});
    }
    await LikesNews.create({
      idUser: r.auth.credentials.id,
      idNews: r.payload.idNews
    })
    return output();
}


export async function deleteLike(r) {
  const del = await LikesNews.findByPk(r.payload.id);
  if (!del){
    return error(Errors.NotFound, "Like not found", {});
  }
    await del.destroy();
    return output();
}


export async function deleteNews(r) {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        idAuthor: r.auth.credentials.id
      }
    });
    if (!news) {
      return error(Errors.NotFound, "News not found", {});
    }
    await news.destroy();
    return output();
}


export async function deleteComment(r) {
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
      return error(Errors.NotFound, "News not found", {});
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
      return error(Errors.NotFound, "Comment not found", {});
    }
    await comment.destroy();
    news.answers = news.answers.filter((n) => {
      return n != r.payload.idComment;
    });
    await news.update({ answers: news.answers });
    return output();
}


export async function findNewsAll(r) {
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
}


export async function changeNewsAndComment(r) {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        idAuthor: r.auth.credentials.id
      }
    });
    if (!news) {
      return error(Errors.NotFound, "News not found", {});
    }
    let objectUpdate: any = {
      text: r.payload.text
    };
    if (news.file != r.payload.file) {
      for (let i = 0; i < news.file.length; i++) {
        if (r.payload.file.indexOf(news.file[i]) == -1) {
          await Media.destroy({
            where: {
              id: news.file[i]
            }
          });
        }
      }
      objectUpdate.file = r.payload.file;
    }
    await news.update(objectUpdate);
    return output();
}

export async function createNews(r) {
    const news = await News.create({
      idAuthor: r.auth.credentials.id,
      checkNews: true,
      text: r.payload.text,
      file: r.payload.file
    });
    return output();
}


export async function createComment(r) {
    const news: any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!news) {
      return error(Errors.NotFound, "News not found", {});
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
    return output();
}

export async function createFile(r) {
    const media: any = await Media.findOne({
      where: {
        userId: r.auth.credentials.id,
        url: r.payload.url
      }
    });
    if (media) {
      return error(Errors.NotFound, "File not found", {});
    }
    const create: any = await Media.create({
      userId: r.payload.userId,
      contentType: r.payload.contentType,
      url: r.payload.url,
      hash: r.payload.hash
    });
    const id: any = create.id;
    return output({ id });
}


export async function getFiles(r) {
    const { offset, limit } = r.query;
    const media = await Media.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        userId: r.auth.credentials.id
      },
      attributes: ["id", "contentType", "url", "hash", "createdAt", "updatedAt"]
    });
    if (!media) {
      return error(Errors.NotFound, "Not found", {});
    }
    return output(media);
}

export async function deleteFile(r) {
  await Media.destroy({
    where: {
      id: r.params.idFile
    }
  });
  return output();
}



