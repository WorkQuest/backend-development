import * as Joi from "joi";
import { sendReview, getReviewsOfUser } from '../../api/review';
import { idSchema, outputOkSchema } from '../../schemes';
import { markSchema, messageSchema, reviewSchema } from '../../schemes/review';

const questIdSchema = idSchema.label('QuestId');
const userIdSchema = idSchema.label('UserId');
const reviewsSchema = Joi.array().items(reviewSchema).label('Reviews');

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
        questId: questIdSchema.required(),
        message: messageSchema.required(),
        mark: markSchema.required(),
      }).label('ReviewSendPayload')
    },
    response: {
      schema: outputOkSchema(reviewSchema).label('ResponseReview')
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
        userId: userIdSchema.required()
      }).label('ParamsReviews')
    },
    response: {
      schema: outputOkSchema(reviewsSchema).label('ResponseReviews')
    }
  }
}];
