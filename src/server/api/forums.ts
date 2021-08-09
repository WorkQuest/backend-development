import { News } from "../models/News";
import { Op } from "sequelize";
import { error, output } from "../utils";
import { Media } from "../models/Media";
import { Errors } from "../utils/errors";
import { LikeNews } from "../models/LikeNews";
import { Comment } from "../models/Comment";
import { CommentMedia } from "../models/CommentMedia";

export async function like(r) {
  const news = await News.findByPk(r.payload.idNews);
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  await LikeNews.create({
    idUser: r.auth.credentials.id,
    idNews: r.payload.idNews
  });
  return output();
}

export async function deleteLike(r) {
  const del = await LikeNews.findByPk(r.payload.id);
  if (!del) {
    return error(Errors.NotFound, "Like not found", {});
  }
  await del.destroy();
  return output();
}

export async function findNewsAll(r) {
  const object: any = {
    limit: r.query.limit,
    offset: r.query.offset,
    where: {
      checkNews: true
    },
    include: [
      {
        model: Comment,
        as: "comment",
        where: {
          [Op.and]: [{ idAnswer: null }]
        },
        required: false,
        limit: 1,
        order: [["createdAt", "DESC"]]
      },
      {
        model: CommentMedia,
        as: "mediaCom",
        where: {
          [Op.and]: [{ idComment: null }]
        },
        required: false,
      }
    ]
  };
  if (!!!r.query.id) {
    object.where.id = r.query.id;
  }
  const news = await News.findAll(object);
  return output(news);
}

export async function createNews(r) {
  const news: any = await News.create({
    idAuthor: r.auth.credentials.id,
    checkNews: true,
    text: r.payload.text
  });
  if (!news) {
    return error(Errors.NotFound, "Don`t create news, bad data", {});
  }
  return output();
}

export async function createComment(r) {
  const news = await News.findOne({
    where: {
      id: r.payload.idNews
    }
  });
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  if (r.payload.idAnswer === "null") {
    let create = await Comment.create({
      idAuthor: r.auth.credentials.id,
      idNews: r.payload.idNews,
      idAnswer: null,
      text: r.payload.text
    });
    if (!create) {
      return error(Errors.NotFound, "Can`t create comment", {});
    }
    return output();
  }
  const comment = await Comment.findOne({
    where: {
      id: r.payload.idAnswer
    }
  });
  if (!comment) {
    return error(Errors.NotFound, "Record not found", {});
  }
  const create = await Comment.create({
    idAuthor: r.auth.credentials.id,
    idNews: r.payload.idNews,
    idAnswer: r.payload.idAnswer,
    text: r.payload.text
  });
  if (!create) {
    return error(Errors.NotFound, "Can`t create comment, record not found", {});
  }
  return output();
}

export async function createFile(r) {
  const media: any = await Media.findOne({
    where: {
      userId: r.auth.credentials.id,
      url: r.payload.url
    }
  });
  if (!media) {
    return error(Errors.NotFound, "File not found", {});
  }
  const create: any = await Media.create({
    userId: r.auth.credentials.id,
    contentType: r.payload.contentType,
    url: r.payload.url,
    hash: r.payload.hash
  });
  if (!create){
    return error(Errors.NotFound, "File don`t create", {});
  }
  const id: any = create.id;
  if (r.payload.idComment !== "null"){
    const file = await CommentMedia.create({
      idMedia: id,
      idComment: r.payload.idComment,
      idNews: r.payload.idNews
    });
    if (!file){
      return error(Errors.NotFound, "File with comment don`t create", {});
    }
    return output();
  }
  const mediaFile = await CommentMedia.create({
    idMedia: id,
    idComment: null,
    idNews: r.payload.idNews
  });
  if (!mediaFile){
    return error(Errors.NotFound, "File don`t create", {});
  }
  return output();
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
