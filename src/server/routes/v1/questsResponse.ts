import * as Joi from "joi";
import { questFullSchema, questIdSchema } from "../../schemes/quest";
import { userIdSchema, userSchema } from "../../schemes/user";
import { countSchema, emptyOkSchema, isoDateSchema, outputOkSchema } from "../../schemes";
import {
  acceptInvite,
  getResponsesToQuest,
  getResponsesUserToQuest,
  questInvite,
  questResponse,
  rejectInvite
} from "../../api/questsResponse";
import {
  messageSchema,
  questsResponseIdSchema,
  questsResponseStatusSchema,
  questsResponseTypeSchema
} from "../../schemes/questsResponse";

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

const userResponseToQuestsScheme = Joi.object({
  workerId: userIdSchema,
  questId: questIdSchema,
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  quest: questFullSchema,
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
    description: "Get responses to quest",
    validate: {
      params: Joi.object({
        questId: questIdSchema.required(),
      }).label("ResponsesToQuestParams")
    },
    response: {
      schema: outputOkSchema(
        Joi.object({
          count: countSchema,
          responses: Joi.array().items(responseToQuest).label("QuestResponsesList")
        }).label("ResponsesToQuestResult")
      ).label("ResponsesToQuestResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/quest/responses/my",
  handler: getResponsesUserToQuest,
  options: {
    id: "v1.quest.responses.my",
    tags: ["api", "quest", "response"],
    description: "Get responses to quest for authorized user",
    response: {
      schema: outputOkSchema(
        Joi.object({
          count: countSchema,
          responses: Joi.array().items(userResponseToQuestsScheme).label("UserQuestResponseList")
        }).label("UserResponsesToQuestsResult")
      ).label("UserResponsesToQuestsResponse")
    },
  },
}, {
  method: "POST",
  path: "/v1/quest/response/{responseId}/accept",
  handler: acceptInvite,
  options: {
    id: "v1.quest.response.accept",
    tags: ["api", "quest", "response"],
    description: "Accept quest invitation",
    validate: {
      params: Joi.object({
        responseId: questsResponseIdSchema.required()
      }).label('AcceptInvitationParams'),
    },
    response: {
      schema: emptyOkSchema.label('AcceptInvitationResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/response/{responseId}/reject",
  handler: rejectInvite,
  options: {
    id: "v1.quest.response.reject",
    tags: ["api", "quest", "response"],
    description: "Reject quest invitation",
    validate: {
      params: Joi.object({
        responseId: questsResponseIdSchema.required()
      }).label('RejectInvitationParams'),
    },
    response: {
      schema: emptyOkSchema.label('RejectInvitationResponse')
    }
  }
}];
