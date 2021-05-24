import * as Joi from "joi";
import { questResponse, questInvite, getResponsesToQuest } from '../../api/questsResponse';
import { questIdSchema } from '../../schemes/quest';
import { emptyOkSchema, isoDateSchema, outputOkSchema } from '../../schemes';
import {
  messageSchema,
  questsResponseStatusSchema,
  questsResponseTypeSchema
} from '../../schemes/questsResponse';
import { userIdSchema, userSchema } from '../../schemes/user';

const responseToQuest = Joi.object({
  workerId: userIdSchema,
  questId: questIdSchema,
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  worker: userSchema,
}).label('ResponseToQuestScheme');

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/response",
  handler: questResponse,
  options: {
    id: "v1.quest.response",
    tags: ["api", "quest", "response"],
    description: "Respond on quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("QuestResponseParams"),
      payload: Joi.object({
        message: messageSchema,
      }).label('QuestResponsePayload'),
    },
    response: {
      schema: emptyOkSchema.label("ResponseQuestResponse"),
    },
  },
}, {
  method: "POST",
  path: "/v1/quest/{questId}/invite",
  handler: questInvite,
  options: {
    id: "v1.quest.invite",
    tags: ["api", "quest", "invite"],
    description: "Invite on quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("QuestInviteParams"),
      payload: Joi.object({
        invitedUserId: userIdSchema.required(),
        message: messageSchema,
      }).label('QuestInvitePayload'),
    },
    response: {
      schema: emptyOkSchema.label("QuestInviteResponse"),
    },
  },
}, {
  method: "GET",
  path: "/v1/quest/{questId}/responses",
  handler: getResponsesToQuest,
  options: {
    id: "v1.quest.responses",
    tags: ["api", "quest", "response"],
    description: "Qet responses to quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("ResponsesToQuestParams")
    },
    response: {
      schema: outputOkSchema(Joi.array().items(responseToQuest)).label("ResponsesToQuestResponse"),
    },
  }
}];
