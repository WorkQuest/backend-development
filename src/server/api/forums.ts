import { News, LikeNews, Comment, LikeComment } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { getMedias } from "../utils/medias";

export async function likeNews(r) {
  const news = await News.findByPk(r.params.newsId);

  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }

  await LikeNews.findOrCreate({
    where: { userId: r.auth.credentials.id, newsId: r.params.newsId },
    defaults: { userId: r.auth.credentials.id, newsId: r.params.newsId },
  });

  return output();
}

export async function deleteLikeNews(r) {
  const news = await News.findByPk(r.params.newsId);

  if (!news) {
    return error(Errors.NotFound, "News not found", {});
  }

  await LikeNews.destroy({
    where: { newsId: r.params.newsId, userId: r.auth.credentials.id }
  });

  return output();
}

export async function likeComment(r) {
  const comment = await Comment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  await LikeComment.findOrCreate({
    where: { userId: r.auth.credentials.id, commentId: r.params.commentId },
    defaults: { userId: r.auth.credentials.id, commentId: r.params.commentId },
  });

  return output();
}

export async function deleteLikeComment(r) {
  const comment = await Comment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  await LikeComment.destroy({
    where: { commentId: r.params.newsId, userId: r.auth.credentials.id }
  });

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

  const news = await News.create({
    authorId: r.auth.credentials.id,
    text: r.payload.text
  }, { transaction });

  await news.$set("medias", medias, { transaction });

  await transaction.commit();

  return output(
    await News.findByPk(news.id)
  );
}

export async function sendComment(r) {
  const news = await News.findOne({
    where: { id: r.params.newsId }
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
    where: { newsId: r.params.newsId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count, comments: rows
  });
}
