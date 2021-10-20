import {error, output} from "../utils";
import {Errors} from "../utils/errors";
import {getMedias} from "../utils/medias";
import {
  Discussion,
  DiscussionLike,
  DiscussionComment,
  DiscussionCommentLike,
} from "@workquest/database-models/lib/models";

export async function getDiscussions(r) {
  const { count, rows } = await Discussion.scope('short').findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, discussions: rows });
}

export async function getSubComments(r) {
  const rootComment = await DiscussionComment.findByPk(r.params.commentId);

  if (!rootComment) {

  }

  const { count, rows } = await DiscussionComment.findAndCountAll({
    where: { rootCommentId: r.query.commentId },
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, comments: rows });
}

export async function createDiscussion(r) {
  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const discussion = await Discussion.create({
    authorId: r.auth.credentials.id,
    title: r.payload.title,
    description: r.payload.description,
  }, { transaction });

  await discussion.$set("medias", medias, { transaction });

  await transaction.commit();

  return output(discussion);
}

export async function sendComment(r) {
  const medias = await getMedias(r.payload.medias);

  const discussion = await Discussion.findOne({
    where: { id: r.params.discussionId }
  });

  if (!discussion) {
    return error(Errors.NotFound, "Discussion not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  if (r.payload.rootCommentId) { // TODO в джобу
    const rootComment = await DiscussionComment.findByPk(r.payload.rootCommentId);

    if (!rootComment) {
      await transaction.rollback();

      return error(Errors.NotFound, "Discussion comment not found", {});
    }

    await rootComment.increment('amountSubComments', { transaction });
  }

  const comment = await DiscussionComment.create({
    authorId: r.auth.credentials.id,
    discussionId: r.params.discussionId,
    rootCommentId: r.payload.rootCommentId,
    text: r.payload.text,
  }, { transaction });

  await comment.$set("medias", medias, { transaction });

  await transaction.commit();

  return output(comment);
}

export async function putDiscussionLike(r) {
  const discussion = await Discussion.findByPk(r.params.discussionId);

  if (!discussion) {
    return error(Errors.NotFound, "Discussion not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  await DiscussionLike.findOrCreate({
    where: { userId: r.auth.credentials.id, discussionId: r.params.discussionId },
    defaults: { userId: r.auth.credentials.id, discussionId: r.params.discussionId },
    transaction,
  });

  await discussion.increment('amountLikes', { transaction });

  await transaction.commit();

  return output();
}

export async function removeDiscussionLike(r) {
  const discussion = await Discussion.findByPk(r.params.discussionId);

  if (!discussion) {
    return error(Errors.NotFound, "Discussion not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  await DiscussionLike.destroy({
    where: { discussionId: r.params.discussionId, userId: r.auth.credentials.id },
    transaction,
  });

  await discussion.decrement('amountLikes', { transaction });

  await transaction.commit();

  return output();
}

export async function putCommentLike(r) {
  const comment = await DiscussionComment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  await comment.increment('amountLikes', { transaction });

  await DiscussionCommentLike.findOrCreate({
    where: { userId: r.auth.credentials.id, commentId: r.params.commentId },
    defaults: { userId: r.auth.credentials.id, commentId: r.params.commentId },
  });

  await transaction.commit();

  return output();
}

export async function removeCommentLike(r) {
  const comment = await DiscussionComment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  await comment.decrement('amountLikes', { transaction });

  await DiscussionCommentLike.destroy({
    where: { commentId: r.params.commentId, userId: r.auth.credentials.id },
    transaction
  });

  await transaction.commit();

  return output();
}
