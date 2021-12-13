import { Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { MediaController } from "../controllers/controller.media";
import {
  User,
  Discussion,
  DiscussionLike,
  DiscussionComment,
  DiscussionCommentLike,
  StarredDiscussion
} from "@workquest/database-models/lib/models";

const searchFields = [
  'title',
  'description',
];

export async function getDiscussion(r) {
  const discussion = await Discussion.findOne({
    include: [{
      model: DiscussionLike,
      as: "liked",
      where: { userId: r.auth.credentials.id },
      required: false
    }, {
      model: StarredDiscussion,
      as: 'star',
      where: { userId: r.auth.credentials.id },
      required: false
    }, {
      model: User.scope('short'),
      as: "author",
    }],
    where: { id: r.params.discussionId }
  });

  if (!discussion) {
    return error(Errors.NotFound, "Discussion not found", { discussionId: r.params.discussionId });
  }

  return output(discussion);
}

export async function getDiscussions(r) {
  const where = { };

  const include = [{
    model: DiscussionLike,
    as: "liked",
    where: { userId: r.auth.credentials.id },
    required: false,
  }, {
    model: StarredDiscussion,
    as: 'star',
    where: { userId: r.auth.credentials.id },
    required: r.query.starred,
  }, {
    model: User,
    as: "author",
  }];

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));
  }

  const { count, rows } = await Discussion.findAndCountAll({
    distinct: true,
    include, where,
    order: [["createdAt", "DESC"]],
    limit: r.query.limit,
    offset: r.query.offset
  });

  return output({ count, discussions: rows });
}

export async function getSubComments(r) {
  const rootComment = await DiscussionComment.findByPk(r.params.commentId);

  if (!rootComment) {
    return error(Errors.NotFound, "Root comment not found", {});
  }

  const { count, rows } = await DiscussionComment.findAndCountAll({
    include: [{
      model: DiscussionCommentLike,
      as: "commentLikes",
      where: { userId: r.auth.credentials.id },
      required: false
    }],
    where: { rootCommentId: rootComment.id },
    order: [["createdAt", "DESC"]],
    limit: r.query.limit,
    offset: r.query.offset
  });

  return output({ count, comments: rows });
}

export async function getRootComments(r) {
  const discussion = await Discussion.findByPk(r.params.discussionId);

  if (!discussion) {
    return error(Errors.NotFound, "Discussion not found", {});
  }

  const { count, rows } = await DiscussionComment.findAndCountAll({
    include: [{
      model: DiscussionCommentLike,
      as: "commentLikes",
      where: { userId: r.auth.credentials.id },
      required: false
    }],
    where: { rootCommentId: null, discussionId: r.params.discussionId },
    order: [["createdAt", "DESC"]],
    limit: r.query.limit,
    offset: r.query.offset
  });

  return output({ count, comments: rows });
}

export async function createDiscussion(r) {
  const medias = await MediaController.getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const discussion = await Discussion.create({
    authorId: r.auth.credentials.id,
    title: r.payload.title,
    description: r.payload.description
  }, { transaction });

  await discussion.$set("medias", medias, { transaction });

  await transaction.commit();

  return output(discussion);
}

export async function sendComment(r) {
  const medias = await MediaController.getMedias(r.payload.medias);

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

    await rootComment.increment("amountSubComments", { transaction });
  } else {
    await discussion.increment("amountComments", { transaction });
  }

  const comment = await DiscussionComment.create({
    authorId: r.auth.credentials.id,
    discussionId: r.params.discussionId,
    rootCommentId: r.payload.rootCommentId,
    text: r.payload.text
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

  const [like, isCreated] = await DiscussionLike.findOrCreate({
    where: { userId: r.auth.credentials.id, discussionId: r.params.discussionId },
    defaults: { userId: r.auth.credentials.id, discussionId: r.params.discussionId },
    transaction
  });

  if (isCreated) {
    await discussion.increment("amountLikes", { transaction });
  }
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
    transaction
  });

  await discussion.decrement("amountLikes", { transaction });

  await transaction.commit();

  return output();
}

export async function putCommentLike(r) {
  const comment = await DiscussionComment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  const [like, isCreated] = await DiscussionCommentLike.findOrCreate({
    where: { userId: r.auth.credentials.id, commentId: r.params.commentId },
    defaults: { userId: r.auth.credentials.id, commentId: r.params.commentId }
  });

  if (isCreated) {
    await comment.increment("amountLikes", { transaction });
  }

  await transaction.commit();

  return output();
}

export async function removeCommentLike(r) {
  const comment = await DiscussionComment.findByPk(r.params.commentId);

  if (!comment) {
    return error(Errors.NotFound, "Comment not found", {});
  }

  const transaction = await r.server.app.db.transaction();

  await comment.decrement("amountLikes", { transaction });

  await DiscussionCommentLike.destroy({
    where: { commentId: r.params.commentId, userId: r.auth.credentials.id },
    transaction
  });

  await transaction.commit();

  return output();
}

export async function getDiscussionUsersLikes(r) {
  const { count, rows } = await User.scope("short").findAndCountAll({
    include: [{
      model: DiscussionLike,
      as: "discussionLikes",
      where: { discussionId: r.params.discussionId }
    }],
    limit: r.query.limit,
    offset: r.query.offset
  });

  return output({ count, users: rows });
}

export async function getCommentUsersLikes(r) {
  const { count, rows } = await User.scope("short").findAndCountAll({
    include: [{
      model: DiscussionCommentLike,
      as: "commentLikes",
      where: { commentId: r.params.commentId }
    }],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, users: rows });
}

export async function markDiscussionStar(r) {
  const discussion = await Discussion.findByPk(r.params.discussionId);

  if (!discussion) {
    return error(Errors.NotFound, "Discussion is not found", {});
  }

  const [star, isCreated] = await StarredDiscussion.findOrCreate({
    where: { discussionId: r.params.discussionId, userId: r.auth.credentials.id },
    defaults: {
      userId: r.auth.credentials.id,
      discussionId: r.params.discussionId
    }
  });

  if (!isCreated) {
    return error(Errors.AlreadyExists, "You already set star on this discussion", {});
  }

  return output();
}

export async function removeDiscussionStar(r) {
  const starredDiscussion = await StarredDiscussion.findOne({
    where: {
      discussionId: r.params.discussionId,
      userId: r.auth.credentials.id,
    }
  });

  if (!starredDiscussion) {
    return error(Errors.NotFound, "This discussion has no star", {});
  }

  await starredDiscussion.destroy();

  return output();
}
