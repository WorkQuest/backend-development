import * as Joi from "joi";
import { create } from "../../api/quest";
import { createQuest } from '../../schemes/quest';
import { emptyOkSchema, hexTokenSchema, outputOkSchema, tokensWithStatus } from '../../schemes';

export default [{
  method: "POST",
  path: "/v1/quest/create",
  handler: create,
  options: {
    auth: 'jwt-access',
    id: "v1.quest.create",
    tags: ["api", "quest", "create"],
    description: "Register new Quest",
    validate: {
      payload: createQuest.label("CreateQuestPayload"),
    },
    response: {
      schema: emptyOkSchema,
    },
  },
}];
