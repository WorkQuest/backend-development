import * as Joi from "joi";
import {
  sendComment,
  getDiscussions,
  putCommentLike,
  getSubComments,
  createDiscussion,
  removeCommentLike,
  putDiscussionLike,
  removeDiscussionLike,
} from "../../api/discussion";
import {
  idSchema,
  idsSchema,
  limitSchema,
  offsetSchema,
  emptyOkSchema,
  outputOkSchema,
  discussionSchema,
  discussionsSchema,
  discussionTitleSchema,
  discussionCommentSchema,
  discussionCommentsSchema,
  discussionDescriptionSchema,
  discussionCommentTextSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/discussions",
  handler: getDiscussions,
  options: {
    id: "v1.getDiscussions",
    tags: ["api", "discussion"],
    description: "Get discussions",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("GetDiscussionsQuery")
    },
    response: {
      schema: outputOkSchema(discussionsSchema).label("GetDiscussionsResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/discussion/comment/{commentId}/sub-comments",
  handler: getSubComments,
  options: {
    id: "v1.getSubComments",
    tags: ["api", "discussion"],
    description: "Get sub comments",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("GetSubCommentsQuery"),
      params: Joi.object({
        commentId: idSchema.required(),
      }).label('GetSubCommentsParams'),
    },
    response: {
      schema: outputOkSchema(discussionCommentsSchema).label("GetSubCommentsResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/discussion/create",
  handler: createDiscussion,
  options: {
    id: "v1.createDiscussion",
    tags: ["api", "discussion"],
    description: "Create discussion",
    validate: {
      payload: Joi.object({
        title: discussionTitleSchema.min(1).max(15).required(), // TODO min и max
        description: discussionDescriptionSchema.required(),
        medias: idsSchema.required().unique().label("MediaIds"),
      }).label("CreateDiscussionPayload"),
    },
    response: {
      schema: outputOkSchema(discussionSchema).label("CreateDiscussionResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/discussion/{discussionId}/comment/send",
  handler: sendComment,
  options: {
    id: "v1.discussion.sendComment",
    tags: ["api", "discussion"],
    description: "Send comment",
    validate: {
      params: Joi.object({
        discussionId: idSchema.required(),
      }).label('SendCommentParams'),
      payload: Joi.object({
        rootCommentId: idSchema.default(null),
        text: discussionCommentTextSchema.required(),
        medias: idsSchema.required().unique().label("MediaIds"),
      }).label("SendCommentPayload")
    },
    response: {
      schema: outputOkSchema(discussionCommentSchema).label("SendCommentResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/discussion/{discussionId}/like",
  handler: putDiscussionLike,
  options: {
    id: "v1.discussion.putLike",
    tags: ["api", "discussion"],
    description: "Like discussion",
    validate: {
      params: Joi.object({
        discussionId: idSchema.required(),
      }).label("PutDiscussionLikeParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/discussion/{discussionId}/like",
  handler: removeDiscussionLike,
  options: {
    id: "v1.discussion.removeLike",
    tags: ["api", "discussion"],
    description: "Remove like in discussion",
    validate: {
      params: Joi.object({
        postId: idSchema.required(),
      }).label("DiscussionLikeParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/discussion/comment/{commentId}/like",
  handler: putCommentLike,
  options: {
    id: "v1.discussion.comment.putLike",
    tags: ["api", "discussion"],
    description: "Put like the comment of discussion",
    validate: {
      params: Joi.object({
        commentId: idSchema.required(),
      }).label("PutCommentLikeParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/discussion/comment/{commentId}/like",
  handler: removeCommentLike,
  options: {
    id: "v1.discussion.comment.removeLike",
    tags: ["api", "discussion"],
    description: "Delete like in comment",
    validate: {
      params: Joi.object({
        commentId: idSchema.required(),
      }).label("RemoveCommentLikeParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];

