import { addLanguage, removeLanguage } from "../../api/language";
import * as Joi from "joi";
import {
  languageSchema,
  outputOkSchema,
  languageTableSchema, userSchema, emptyOkSchema, idSchema
} from "@workquest/database-models/lib/schemes";

export default[{
  method: 'POST',
  path: '/vi/language/add',
  handler: addLanguage,
  options: {
    id: "v1.language.add",
    tags: ["api", "language"],
    description: "Add language to user",
    validate: {
      payload: Joi.object({
        language: languageSchema,
      }).label('LanguagePayloadSchema')
    },
    response: {
      schema: outputOkSchema(userSchema).label('LanguageOkSchema')
    }
  }
}, {
  method: 'DELETE',
  path: '/vi/language/{languageId}/remove',
  handler: removeLanguage,
  options: {
    id: "v1.language.remove",
    tags: ["api", "language"],
    description: "Remove language from user",
    validate: {
      params: Joi.object({
        languageId: idSchema,
      }).label('LanguageParamsSchema')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
