import * as Joi from "joi";
import { idSchema, isoDateSchema } from "./index";
import { mediaUrlOnlySchema } from "./media";
import { UserRole } from "../models/User";
import { reviewSchema } from "./review";
import { ratingStatisticSchema } from "./ratingStatistic";

const reviewsSchema = Joi.array().items(reviewSchema).label("Reviews");

export const emailSchema = Joi.string().email().max(1000).example("user@example.com").label("UserEmail");
export const passwordSchema = Joi.string().min(8).max(1000).example("p@ssw0rd").label("UserPassword");
export const firstNameSchema = Joi.string().min(1).max(1000).example("ivan").label("UserFirstName");
export const lastNameSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserLastName");
export const userRoleSchema = Joi.string().valid(...Object.values(UserRole)).example(UserRole.Worker).label("UserRole");
export const phoneSchema = Joi.string().example('+79991234567').label("Phone");
export const tempPhoneSchema = Joi.string().example('+79991234567').label("TempPhone");

export const socialMediaNicknamesSchema = Joi.object({
  instagram: Joi.string().allow(null).label('Instagram'),
  twitter: Joi.string().allow(null).label('Twitter'),
  linkedin: Joi.string().allow(null).label('Linkedin'),
  facebook: Joi.string().allow(null).label('Facebook'),
}).label('SocialMediaNicknames');

export const knowledgeSchema = Joi.object({
  from: Joi.string().label('From'),
  to: Joi.string().label('To'),
  place: Joi.string().label('Place'),
}).label('Knowledge');

export const workExperienceSchema = Joi.object({
  from: Joi.string().label('From'),
  to: Joi.string().label('To'),
  place: Joi.string().label('Place'),
}).label('WorkExperience');

export const additionalInfoWorkerSchema = Joi.object({
  secondMobileNumber: Joi.string().allow(null).label('SecondMobileNumber'),
  address: Joi.string().allow(null).label('Address'),
  socialNetwork: socialMediaNicknamesSchema.label('SocialNetwork'),
  skills: Joi.array().items(Joi.string()).default([]).label('Skills'),
  educations: Joi.array().items(knowledgeSchema).default([]).label('Educations'),
  workExperiences: Joi.array().items(workExperienceSchema).default([]).label('WorkExperiences'),
  description: Joi.string().allow(null).label("Description"),
}).label('AdditionalInfoWorker');

export const additionalInfoEmployerSchema = Joi.object({
  secondMobileNumber: Joi.string().allow(null).label('SecondMobileNumber'),
  address: Joi.string().allow(null).label('Address'),
  socialNetwork: socialMediaNicknamesSchema.label('SocialNetwork'),
  description: Joi.string().allow(null).label("Description"),
  company: Joi.string().allow(null).label('Company'),
  CEO: Joi.string().allow(null).label('CEO'),
  website: Joi.string().allow(null).label('Website'),
}).label('AdditionalInfoEmployer');

export const userSchema = Joi.object({
  id: idSchema.label("UserId"),
  avatarId: idSchema.label('AvatarId'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  tempPhone: tempPhoneSchema,
  email: emailSchema,
  additionalInfo: Joi.object()
    .concat(additionalInfoEmployerSchema)
    .concat(additionalInfoWorkerSchema)
    .allow(null).label('AdditionalInfo'),
  role: userRoleSchema,
  avatar: mediaUrlOnlySchema.allow(null),
  reviews: reviewsSchema,
  ratingStatistic: ratingStatisticSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
}).label("UserSchema");
