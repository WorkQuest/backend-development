import * as Joi from "joi";
import {
  getForumPosts,
  createForumPost,
  sendForumPostComment,
  putForumPostLike,
  removeForumPostLike,
  putForumPostCommentLike,
  removeForumPostCommentLike,
  getForumPostComments,
  getCountForumPostLikes,
  getCountForumPostCommentLikes,
} from "../../api/forums";
import {
  emptyOkSchema,
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  textTitleSchema,
  mediaIdsSchema,
  forumPostCommentsSchema,
  forumPostCommentSchema,
  forumPostsSchema,
  forumPostSchema,
  forumPostRootCommentIdSchema,
  forumPostGetLikesSchema
} from "@workquest/database-models/lib/schemes";

const forumPostIdSchema = idSchema.label("ForumPostId");
const forumPostLikeIdSchema = idSchema.label("ForumPostLikeId");
const forumPostCommentIdSchema = idSchema.label("ForumPostCommentId");

export default [{
  method: "GET",
  path: "/v1/forum/posts",
  handler: getForumPosts,
  options: {
    id: "v1.forum.getPosts",
    tags: ["api", "forum", "getForumPosts"],
    description: "Get forum posts",
    validate: {
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetPostsQuery")
    },
    response: {
      schema: outputOkSchema(forumPostsSchema).label("GetPostsSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/post/create",
  handler: createForumPost,
  options: {
    id: "v1.forum.createPost",
    tags: ["api", "forum", "createPost"],
    description: "Create new forum post",
    validate: {
      payload: Joi.object({
        text: textTitleSchema.required(),
        medias: mediaIdsSchema.default([]).unique().label("MediaIds")
      }).label("CreateForumPostPayload")
    },
    response: {
      schema: outputOkSchema(forumPostSchema).label("CreateForumPostSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/post/{forumPostId}/comment/send",
  handler: sendForumPostComment,
  options: {
    id: "v1.forum.sendForumPostComment",
    tags: ["api", "forum", "sendPostComment"],
    description: "Send comment with forum posts",
    validate: {
      params: Joi.object({
        forumPostId: forumPostIdSchema.required()
      }),
      payload: Joi.object({
        rootCommentId: forumPostRootCommentIdSchema,
        text: textTitleSchema.required()
      }).label("SendForumPostCommentPayload")
    },
    response: {
      schema: outputOkSchema(forumPostCommentSchema).label("ForumPostCommentSchemaResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/post/{forumPostId}/like",
  handler: putForumPostLike,
  options: {
    id: "v1.forum.post.putLike",
    tags: ["api", "forum", "putPostLike"],
    description: "Like forum post",
    validate: {
      params: Joi.object({
        forumPostId: forumPostIdSchema.required()
      }).label("PutForumPostIdParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/forum/post/{forumPostId}/like",
  handler: removeForumPostLike,
  options: {
    id: "v1.forum.post.removeLike",
    tags: ["api", "forum", "removePostLike"],
    description: "Remove like in forum post",
    validate: {
      params: Joi.object({
        forumPostId: forumPostLikeIdSchema.required()
      }).label("ForumPostLikeIdParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/forum/comment/{forumPostCommentId}/like",
  handler: putForumPostCommentLike,
  options: {
    id: "v1.forum.post.comment.putLike",
    tags: ["api", "forum","putPostCommentLike"],
    description: "Put like the comment of a post in the forum",
    validate: {
      params: Joi.object({
        forumPostCommentId: forumPostCommentIdSchema.required()
      }).label("PutForumPostCommentLikeParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/forum/comment/{forumPostCommentId}/like",
  handler: removeForumPostCommentLike,
  options: {
    id: "v1.forum.post.comment.removeLike",
    tags: ["api", "forum", "removePostCommentLike"],
    description: "Delete like in comment",
    validate: {
      params: Joi.object({
        forumPostCommentId: forumPostCommentIdSchema.required()
      }).label("RemoveForumPostCommentLikeParams")
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/forum/post/{forumPostId}/comments",
  handler: getForumPostComments,
  options: {
    id: "v1.forum.post.getComments",
    tags: ["api", "forum", "getPostComments"],
    description: "Get all comments for a forum post",
    validate: {
      params: Joi.object({
        forumPostId: forumPostIdSchema
      }).label("GetForumPostIdParams"),
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetForumPostCommentsQuery")
    },
    response: {
      schema: outputOkSchema(forumPostCommentsSchema).label("ForumPostCommentsSchemaResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/forum/post/{forumPostId}/likes",
  handler: getCountForumPostLikes,
  options: {
    id: "v1.forum.post.getCountLikes",
    tags: ["api", "forum", "getCountForumPostLikes"],
    description: "Get the number of likes on a forum post",
    validate: {
      params: Joi.object({
        forumPostId: forumPostIdSchema
      }).label("GetCountForumPostIdParams"),
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetCountForumPostLikesQuery")
    },
    response: {
      schema: outputOkSchema(forumPostGetLikesSchema).label("GetCountLikeNewsResponse")
    }
  }
}, {
  method: "GET",
  path: "/v1/forum/post/comment/{forumPostCommentId}/likes",
  handler: getCountForumPostCommentLikes,
  options: {
    id: "v1.forum.post.comment. getCountLikes",
    tags: ["api", "forum", "getCountForumPostCommentLikes"],
    description: "Get the number of likes for a comment in a forum post",
    validate: {
      params: Joi.object({
        forumPostCommentId: forumPostCommentIdSchema
      }).label("GetCountForumPostCommentLikesParams"),
      query: Joi.object({
        limit: limitSchema.required(),
        offset: offsetSchema.required()
      }).label("GetCountForumPostCommentLikesQuery")
    },
    response: {
      schema: outputOkSchema(forumPostCommentsSchema).label("getCountForumPostCommentLikesResponse")
    }
  }
}];

