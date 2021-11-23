import * as Joi from "joi";
import {
  idSchema,
  limitSchema,
  offsetSchema,
  reviewSchema,
  outputOkSchema,
  reviewMarkSchema,
  reviewMessageSchema,
  outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";
import { sendReview, getReviewsOfUser } from '../../api/review';

export default [{
  method: "POST",
  path: "/v1/review/send",
  handler: sendReview,
  options: {
    auth: 'jwt-access',
    id: "v1.review.send",
    tags: ["api", "review"],
    description: "Send review for user",
    validate: {
      payload: Joi.object({
        questId: idSchema.required(),
        message: reviewMessageSchema.required(),
        mark: reviewMarkSchema.required(),
      }).label('ReviewSendPayload')
    },
    response: {
      schema: outputOkSchema(reviewSchema).label('ReviewResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/reviews",
  handler: getReviewsOfUser,
  options: {
    auth: 'jwt-access',
    id: "v1.user.reviews",
    tags: ["api", "review"],
    description: "Get all reviews about user",
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label('ReviewsParams'),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      }).label("ReviewsQuery"),
    },
    response: {
      schema: outputPaginationSchema('reviews', reviewSchema).label('ReviewsResponse')
    }
  }
}];
