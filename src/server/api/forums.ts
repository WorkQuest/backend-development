import { News } from "../models/News";
import { Op, where } from "sequelize";
import { error, output } from "../utils";
import { Media } from "../models/Media";
import { Errors } from "../utils/errors";
import { LikesNews } from "../models/LikesNews";
import { Comments } from "../models/Comment";
import { CommentMedia } from "../models/CommentMedia";
import { QuestsResponseType } from "../models/QuestsResponse";


export async function like(r) {
  const news = await News.findByPk(r.payload.idNews);
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  await LikesNews.create({
    idUser: r.auth.credentials.id,
    idNews: r.payload.idNews
  });
  return output();
}


export async function deleteLike(r) {
  const del = await LikesNews.findByPk(r.payload.id);
  if (!del) {
    return error(Errors.NotFound, "Like not found", {});
  }
  await del.destroy();
  return output();
}


export async function deleteNews(r) {
  const news = await News.findOne({
    where: {
      id: r.payload.id,
    }
  });
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  if (news.idAuthor !== r.auth.credentials.id){
    return error(Errors.NotFound, "No permission to execute command", {});
  }
  await news.destroy();
  return output();
}


export async function deleteComment(r) {
  const comment = await Comments.findOne({
    where: {
      id: r.payload.id,
      idAuthor: r.auth.credentials.id
    }
  });
  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }
  await comment.destroy();
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
        model: Comments,
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

//TODO: Изменение новостей(Уточнить все необходимые поля)
// export async function changeNews(r) {
//   const news = await News.findOne({
//     where: {
//       id: r.payload.id,
//       idAuthor: r.auth.credentials.id
//     }
//   });
//   if (!news) {
//     return error(Errors.NotFound, "News not found", {});
//   }
//   let objectUpdate: any = {
//     text: r.payload.text
//   };
//   await news.update(objectUpdate);
//   return output();
// }

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
    let create = await Comments.create({
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
  const comment = await Comments.findOne({
    where: {
      id: r.payload.idAnswer
    }
  });
  if (!comment) {
    return error(Errors.NotFound, "Record not found", {});
  }
  const create = await Comments.create({
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

export async function deleteFile(r) {
  await Media.destroy({
    where: {
      id: r.params.idFile
    }
  });
  return output();
}



