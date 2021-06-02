import * as Joi from "joi";
import { UserRole, UserStatus } from "../models/User";

export const userIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("UserId");
export const avatarSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("UserAvatar");
export const emailSchema = Joi.string().email().max(1000).example("user@example.com").label("UserEmail");
export const passwordSchema = Joi.string().min(8).max(1000).example("p@ssw0rd").label("UserPassword");
export const firstNameSchema = Joi.string().min(1).max(1000).example("ivan").label("UserFirstName");
export const lastNameSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserLastName");
export const userRoleSchema = Joi.string().valid(...Object.values(UserRole)).example(UserRole.Worker).label("UserRole");
export const accountStatusSchema = Joi.number().valid(...Object.keys(UserStatus).map(key => parseInt(key)).filter(key => !isNaN(key))).example(UserStatus.Unconfirmed).label("UserStatus");

export const userSchema = Joi.object({
  id: userIdSchema,
  firstName: firstNameSchema,
  avatar: avatarSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  role: userRoleSchema
}).label("UserSchema");
