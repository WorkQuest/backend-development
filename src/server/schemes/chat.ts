import * as Joi from "joi";
import { arrayIdSchema, idSchema } from "./index";

export const chatSchemaCreate = Joi.object({
  userId: idSchema,
  membersId: arrayIdSchema,
  checkNews: Joi.boolean().label('It`s dialog or chat')
}).label("FileScheme");
