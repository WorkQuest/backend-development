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

export const socialMediaNicknamesSchema = Joi.object({
  instagram: Joi.string().allow(null).label('Instagram'),
  twitter: Joi.string().allow(null).label('Twitter'),
  linkedin: Joi.string().allow(null).label('Linkedin'),
  facebook: Joi.string().allow(null).label('Facebook'),
});

export const additionalInfoWorkerSchema = Joi.object({
  firstMobileNumber: Joi.string().allow(null).label('FirstMobileNumber'),
  secondMobileNumber: Joi.string().allow(null).label('SecondMobileNumber'),
  address: Joi.string().allow(null).label('Address'),
  description: Joi.string().label('Description'),
  socialNetwork: socialMediaNicknamesSchema.label('SocialNetwork'),
});

export const additionalInfoEmployerSchema = Joi.object({
  firstMobileNumber: Joi.string().allow(null).label('FirstMobileNumber'),
  secondMobileNumber: Joi.string().allow(null).label('SecondMobileNumber'),
  address: Joi.string().allow(null).label('Address'),
  socialNetwork: socialMediaNicknamesSchema.label('SocialNetwork'),
  company: Joi.string().allow(null).label('Company'),
  CEO: Joi.string().allow(null).label('CEO'),
  website: Joi.string().allow(null).label('Website'),
});

export const userSchema = Joi.object({
  id: idSchema.label("UserId"),
  avatarId: idSchema.label('AvatarId'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  additionalInfo: Joi.object()
    .concat(additionalInfoEmployerSchema)
    .concat(additionalInfoWorkerSchema)
    .allow(null).label('AdditionalInfo'),
  role: userRoleSchema,
  avatar: mediaUrlOnlySchema.allow(null),
  reviews: reviewsSchema,
  averageRating: averageRatingSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("UserSchema");
