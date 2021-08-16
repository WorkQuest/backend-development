import { News } from "../models/News";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { LikeNews } from "../models/LikeNews";
import { Comment } from "../models/Comment";
import { getMedias } from "../utils/medias";
import { LikeComment } from "../models/LikeComment";

export async function likeNews(r) {
  const news = await News.findByPk(r.params.newsId);
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  const user = await LikeNews.findOne({
    where: { userId: r.auth.credentials.id, newsId: r.params.newsId }
  });
  if (user) {
    return error(Errors.NotFound, "The user has already liked it", {});
  }
  const like = await LikeNews.create({
    userId: r.auth.credentials.id,
    newsId: r.params.newsId
  });
  return output(await LikeNews.findByPk(like.id));
}

export async function deleteLikeNews(r) {
  const del = await LikeNews.findByPk(r.params.likeId);
  if (!del) {
    return error(Errors.NotFound, "Like not found", {});
  }
  const like = await LikeNews.findOne({
    where: { userId: r.auth.credentials.id, id: r.params.likeId }
  });
  if (!like) {
    return error(Errors.NotFound, "The user did not like it", {});
  }
  await del.destroy();
  return output();
}

export async function likeComment(r) {
  const comment = await Comment.findByPk(r.params.commentId);
  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }
  const user = await LikeComment.findOne({
    where: { userId: r.auth.credentials.id, commentId: r.params.commentId }
  });
  if (user) {
    return error(Errors.NotFound, "The user has already liked it", {});
  }
  const like = await LikeComment.create({
    userId: r.auth.credentials.id,
    commentId: r.params.commentId
  });
  return output(await LikeComment.findByPk(like.id));
}

export async function deleteLikeComment(r) {
  const del = await LikeComment.findByPk(r.params.likeCommentId);
  if (!del) {
    return error(Errors.NotFound, "Like in comment not found", {});
  }
  const like = await LikeComment.findOne({
    where: { userId: r.auth.credentials.id, id: r.params.likeCommentId }
  });
  if (!like) {
    return error(Errors.NotFound, "The user did not like it", {});
  }
  await del.destroy();
  return output();
}

export async function getNews(r) {
  const { count, rows } = await News.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count, news: rows
  });
}

export async function createNews(r) {
  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const news: any = await News.create({
    authorId: r.auth.credentials.id,
    text: r.payload.text
  }, { transaction });
  await news.$set("medias", medias, { transaction });

  await transaction.commit();
  if (!news) {
    return error(Errors.NotFound, "Don`t create news", {});
  }
  return output(
    await News.findByPk(news.id)
  );
}

export async function sendComment(r) {
  const news = await News.findOne({
    where: {
      id: r.params.newsId
    }
  });
  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }
  if (r.payload.rootCommentId === undefined) {
    let create = await Comment.create({
      authorId: r.auth.credentials.id,
      newsId: r.params.newsId,
      rootCommentId: null,
      text: r.payload.text
    });
    if (!create) {
      return error(Errors.NotFound, "Can`t create comment", {});
    }
    return output(create);
  }
  const comment = await Comment.findOne({
    where: {
      id: r.payload.rootCommentId
    }
  });
  if (!comment) {
    return error(Errors.NotFound, "Record not found", {});
  }
  const create = await Comment.create({
    authorId: r.auth.credentials.id,
    newsId: r.params.newsId,
    rootCommentId: r.payload.rootCommentId,
    text: r.payload.text
  });
  if (!create) {
    return error(Errors.NotFound, "Can`t create comment, record not found", {});
  }
  return output(create);
}

export async function getNewsComments(r) {
  const { count, rows } = await Comment.findAndCountAll({
    where: {newsId: r.params.newsId},
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count, rows
  });
}
