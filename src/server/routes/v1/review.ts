import * as Joi from "joi";
import {
  outputOkSchema,
  idSchema,
  reviewMarkSchema,
  reviewMessageSchema,
  reviewSchema,
  reviewsSchema,
} from "@workquest/database-models/lib/schemes";
import { sendReview, getReviewsOfUser } from '../../api/review';

export default [{
  method: "POST",
  path: "/v1/review/send",
  handler: sendReview,
  options: {
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
    id: "v1.user.reviews",
    tags: ["api", "review"],
    description: "Get all reviews about user",
    validate: {
      params: Joi.object({
        userId: idSchema.required()
      }).label('ParamsReviews')
    },
    response: {
      schema: outputOkSchema(reviewsSchema).label('ReviewsResponse')
    }
  }
}];
