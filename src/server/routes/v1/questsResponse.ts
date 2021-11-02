import * as Joi from "joi";
import {
  outputOkSchema,
  emptyOkSchema,
  idSchema,
  questsResponseMessageSchema,
  questsResponsesWithCountSchema, offsetSchema, limitSchema
} from "@workquest/database-models/lib/schemes";
import {
  acceptInviteOnQuest,
  userResponsesToQuest,
  responsesToQuestsForUser,
  inviteOnQuest,
  responseOnQuest,
  rejectInviteOnQuest,
  rejectResponseOnQuest,
} from "../../api/questsResponse";

export default [{
  method: "POST",
  path: "/v1/quest/{questId}/response",
  handler: responseOnQuest,
  options: {
    id: "v1.quest.response",
    tags: ["api", "questResponse"],
    description: "Respond on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("QuestResponseParams"),
      payload: Joi.object({
        message: questsResponseMessageSchema,
      }).label('QuestResponsePayload'),
    },
    response: {
      schema: emptyOkSchema
    },
  },
}, {
  method: "POST",
  path: "/v1/quest/{questId}/invite",
  handler: inviteOnQuest,
  options: {
    id: "v1.quest.invite",
    tags: ["api", "questResponse"],
    description: "Invite on quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("QuestInviteParams"),
      payload: Joi.object({
        invitedUserId: idSchema.required(),
        message: questsResponseMessageSchema,
      }).label('QuestInvitePayload'),
    },
    response: {
      schema: emptyOkSchema
    },
  },
}, {
  method: "GET",
  path: "/v1/quest/{questId}/responses",
  handler: userResponsesToQuest,
  options: {
    id: "v1.quest.responses",
    tags: ["api", "questResponse"],
    description: "Get responses to quest",
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("ResponsesToQuestParams"),
      query: Joi.object({
        offset: offsetSchema,
        limit: limitSchema,
      })
    },
    response: {
      schema: outputOkSchema(questsResponsesWithCountSchema).label("ResponsesToQuestWithCountResponse")
    },
  }
}, {
  method: "GET",
  path: "/v1/quest/responses/my",
  handler: responsesToQuestsForUser,
  options: {
    id: "v1.quest.responses.my",
    tags: ["api", "questResponse"],
    description: "Get responses to quest for authorized user",
    response: {
      schema: outputOkSchema(questsResponsesWithCountSchema).label("UserResponsesToQuestsWithCountResponse")
    },
  },
}, {
  method: "POST",
  path: "/v1/quest/response/{responseId}/accept",
  handler: acceptInviteOnQuest,
  options: {
    id: "v1.quest.response.accept",
    tags: ["api", "questResponse"],
    description: "Accept quest invitation",
    validate: {
      params: Joi.object({
        responseId: idSchema.required()
      }).label('AcceptInvitationParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/response/{responseId}/reject",
  handler: rejectInviteOnQuest,
  options: {
    id: "v1.quest.response.reject",
    tags: ["api", "questResponse"],
    description: "Reject quest invitation",
    validate: {
      params: Joi.object({
        responseId: idSchema.required()
      }).label('RejectInvitationParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/employer/{responseId}/reject",
  handler: rejectResponseOnQuest,
  options: {
    id: "v1.quest.response.rejectResponseOnQuest",
    tags: ["api", "questResponse"],
    description: "Reject the answer to the quest",
    validate: {
      params: Joi.object({
        responseId: idSchema.required()
      }).label('RejectResponseOnQuestParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
