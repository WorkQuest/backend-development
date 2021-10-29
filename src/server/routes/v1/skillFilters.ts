import * as Joi from "joi";
import {
  sendComment,
  getDiscussions,
  putCommentLike,
  getSubComments,
  getRootComments,
  createDiscussion,
  removeCommentLike,
  putDiscussionLike,
  removeDiscussionLike,
  getCommentUsersLikes,
  getDiscussionUsersLikes,
} from "../../api/discussion";
import {
  idSchema,
  idsSchema,
  limitSchema,
  offsetSchema,
  emptyOkSchema,
  outputOkSchema,
  userShortSchema,
  discussionSchema,
  discussionsSchema,
  discussionTitleSchema,
  outputPaginationSchema,
  discussionCommentSchema,
  discussionCommentsSchema,
  discussionDescriptionSchema,
  discussionCommentTextSchema, filterSchema
} from "@workquest/database-models/lib/schemes";
import { getFilters } from "../../api/skillFilters";

export default [{
  method: "GET",
  path: "/v1/skillFilters",
  handler: getFilters,
  options: {
    id: "v1.skillFilters",
    tags: ["api", "skillFilters"],
    description: "Get discussions",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("GetDiscussionsQuery")
    },
    response: {
      schema: outputOkSchema(filterSchema).label("GetDiscussionsResponse")
    }
  }
},];

