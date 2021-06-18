import * as Joi from "joi";
import { idSchema, isoDateSchema } from './index';
import { mediaUrlOnlySchema } from './media';
import { UserRole } from "../models/User";
import { reviewSchema } from './review';

const reviewsSchema = Joi.array().items(reviewSchema).label('Reviews');

export const emailSchema = Joi.string().email().max(1000).example("user@example.com").label("UserEmail");
export const passwordSchema = Joi.string().min(8).max(1000).example("p@ssw0rd").label("UserPassword");
export const firstNameSchema = Joi.string().min(1).max(1000).example("ivan").label("UserFirstName");
export const lastNameSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserLastName");
export const userRoleSchema = Joi.string().valid(...Object.values(UserRole)).example(UserRole.Worker).label("UserRole");
export const averageRatingSchema = Joi.number().allow(null).label('AverageRating');

export const userSchema = Joi.object({
  id: idSchema.label("UserId"),
  avatarId: idSchema.label('AvatarId'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  role: userRoleSchema,
  avatar: mediaUrlOnlySchema.allow(null),
  reviews: reviewsSchema,
  averageRating: averageRatingSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("UserSchema");
