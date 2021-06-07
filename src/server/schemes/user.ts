import * as Joi from "joi";
import { idSchema } from './index';
import { mediaUrlOnlySchema } from './media';
import { UserRole } from "../models/User";

export const emailSchema = Joi.string().email().max(1000).example("user@example.com").label("UserEmail");
export const passwordSchema = Joi.string().min(8).max(1000).example("p@ssw0rd").label("UserPassword");
export const firstNameSchema = Joi.string().min(1).max(1000).example("ivan").label("UserFirstName");
export const lastNameSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserLastName");
export const userRoleSchema = Joi.string().valid(...Object.values(UserRole)).example(UserRole.Worker).label("UserRole");

export const userSchema = Joi.object({
  id: idSchema.label("UserId"),
  avatarId: idSchema.label('AvatarId'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  role: userRoleSchema,
  avatar: mediaUrlOnlySchema.allow(null),
}).label("UserSchema");
