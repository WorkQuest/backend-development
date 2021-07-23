import { News } from "../models/News";

import { error, getUUID, output } from "../utils";
import { Op, where } from "sequelize";


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
  console.log(r.query, '==================================================================');
  try {
    const object : any = {
      limit: r.query.limit,
      offset: r.query.offset,
      where: {
        checkNews: true
      }
    }
    if (!!!r.query.id) {
        object.where.id = r.query.id;
      }
    const news = await News.findAll(object);
    return output(news);
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}


export async function updateNewsAndComment(r) {
  try {
    const news = await News.findOne({
      where: {
        id: r.payload.id,
        idAuthor: r.auth.credentials.id
      }
    });
    if(!news){
      return error(404000, "Not found news", {});
    }
    await news.update({
      text: r.payload.text
    });
    return output({ status: "Success" });
  } catch (e) {
    return error(500000, "Internal server error", {});
  }
}



