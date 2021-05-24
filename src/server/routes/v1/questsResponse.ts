import * as Joi from "joi";
import { questResponse, questInvite } from '../../api/questsResponse'
import { questIdSchema } from '../../schemes/quest';
import { emptyOkSchema } from '../../schemes';
import { messageSchema } from '../../schemes/questsResponse';
import { userIdSchema } from '../../schemes/user';

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
}];
