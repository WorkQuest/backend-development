import {
  ForumPost,
  ForumPostComment,
  ForumPostCommentLike,
  ForumPostLike
} from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { getMedias } from "../utils/medias";

export async function getForumPosts(r) {
  const { count, rows } = await ForumPost.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count, forumPost: rows
  });
}

export async function createForumPost(r) {
  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const post = await ForumPost.create({
    authorId: r.auth.credentials.id,
    text: r.payload.text
  }, { transaction });

  await post.$set("medias", medias, { transaction });

  await transaction.commit();

  return output(
    await ForumPost.findByPk(post.id)
  );
}

export async function sendForumPostComment(r) {
  const post = await ForumPost.findOne({
    where: { id: r.params.forumPostId }
  });

  if (!post) {
    return error(Errors.NotFound, "Forum post not found", {});
  }
  const comment = ForumPostComment.create({
    authorId: r.auth.credentials.id,
    forumPostId: r.params.forumPostId,
    rootCommentId: r.payload.rootCommentId,
    text: r.payload.text
  })
  if (!comment) {
    return error(Errors.NotFound, "Can`t create comment", {});
  }
  return output(comment);
}

export async function putForumPostLike(r) {
  const post = await ForumPost.findByPk(r.params.forumPostId);

  if (!post) {
    return error(Errors.NotFound, "Forum post not found", {});
  }

  await ForumPostLike.findOrCreate({
    where: { userId: r.auth.credentials.id, forumPostId: r.params.forumPostId },
    defaults: { userId: r.auth.credentials.id, forumPostId: r.params.forumPostId },
  });

  return output();
}

export async function removeForumPostLike(r) {
  const post = await ForumPost.findByPk(r.params.forumPostId);

  if (!post) {
    return error(Errors.NotFound, "Forum post not found", {});
  }

  await ForumPostLike.destroy({
    where: { forumPostId: r.params.forumPostId, userId: r.auth.credentials.id }
  });

  return output();
}

export async function putForumPostCommentLike(r) {
  const comment = await ForumPostComment.findByPk(r.params.forumPostCommentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  await ForumPostCommentLike.findOrCreate({
    where: { userId: r.auth.credentials.id, forumPostCommentId: r.params.forumPostCommentId },
    defaults: { userId: r.auth.credentials.id, forumPostCommentId: r.params.forumPostCommentId },
  });

  return output();
}

export async function removeForumPostCommentLike(r) {
  const comment = await ForumPostComment.findByPk(r.params.forumPostCommentId);

  if (!comment) {
    return error(Errors.NotFound, "No comment was found in the forum post", {});
  }

  await ForumPostCommentLike.destroy({
    where: { forumPostCommentId: r.params.forumPostCommentId, userId: r.auth.credentials.id }
  });

  return output();
}

export async function getForumPostComments(r) {
  const { count, rows } = await ForumPostComment.findAndCountAll({
    where: { forumPostId: r.params.forumPostId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({
    count, comments: rows
  });
}

export async function getCountForumPostLikes(r) {
  const { count, rows } = await ForumPostLike.findAndCountAll({
    where: {forumPostId: r.params.forumPostId},
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (!{ count, rows }){
    return error(Errors.NotFound, "Like does not exist on зщые in a forum", {});
  }

  return output({
    count, likes: rows
  });
}

export async function getCountForumPostCommentLikes(r) {
  const { count, rows } = await ForumPostCommentLike.findAndCountAll({
    where: {forumPostCommentId: r.params.forumPostCommentId},
    limit: r.query.limit,
    offset: r.query.offset
  });
  console.log(count,rows);

  if (!{ count, rows }){
    return error(Errors.NotFound, "Like does not exist on comments in a forum post", {});
  }

  return output({
    count, likes: rows
  });
}
