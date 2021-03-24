import * as Joi from "joi";
import { UserRole } from "../models/User";

export const emailSchema = Joi.string().email().max(1000).example("user@example.com").label("UserEmail");
export const passwordSchema = Joi.string().min(8).max(1000).example("p@ssw0rd").label("UserPassword");
export const firstNameSchema = Joi.string().min(1).max(1000).example("ivan").label("UserFirstName");
export const lastNameSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserLastName");
export const avatarSchema = Joi.string().min(1).max(1000).example("ivanov").label("UserAvatar");
export const userIdSchema = Joi.string().uuid().example("fa0e2e4e-c53f-4af7-8906-1649daa0cce3").label("UserId");
export const userRoleSchema = Joi.string().allow(...Object.values(UserRole)).example(UserRole.Worker).label("UserRole");

export const userSchema = Joi.object({
  id: userIdSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  role: userRoleSchema
}).label("UserSchema");
