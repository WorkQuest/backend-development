import * as Joi from "joi";
import { questFullSchema } from "../../schemes/quest";
import { userSchema } from '../../schemes/user';
import { countSchema, emptyOkSchema, idSchema, isoDateSchema, outputOkSchema } from '../../schemes';
import {
  messageSchema,
  questsResponseStatusSchema,
  questsResponseTypeSchema
} from "../../schemes/questsResponse";
import {
  acceptInviteOnQuest,
  userResponsesToQuest,
  responsesToQuestsForUser,
  inviteOnQuest,
  responseOnQuest,
  rejectInviteOnQuest
} from "../../api/questsResponse";

const userIdSchema = idSchema.label('UserId');
const questIdSchema = idSchema.label('QuestId');
const questsResponseIdSchema = idSchema.label('QuestsResponseId');
const responseToQuest = Joi.object({
  workerId: userIdSchema.label('WorkerId'),
  questId: questIdSchema,
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  worker: userSchema,
}).label('ResponseToQuestScheme');

const userResponseToQuestsSchema = Joi.object({
  workerId: userIdSchema,
  questId: questIdSchema,
  status: questsResponseStatusSchema,
  type: questsResponseTypeSchema,
  message: messageSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  quest: questFullSchema,
}).label('UserResponseToQuestScheme');

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
        questId: questIdSchema.required(),
      }).label("QuestResponseParams"),
      payload: Joi.object({
        message: messageSchema,
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
        questId: questIdSchema.required(),
      }).label("QuestInviteParams"),
      payload: Joi.object({
        invitedUserId: userIdSchema.required(),
        message: messageSchema,
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
  handler: responsesToQuestsForUser,
  options: {
    id: "v1.quest.responses.my",
    tags: ["api", "questResponse"],
    description: "Get responses to quest for authorized user",
    response: {
      schema: outputOkSchema(
        Joi.object({
          count: countSchema,
          responses: Joi.array().items(userResponseToQuestsSchema).label("UserQuestResponseList")
        }).label("UserResponsesToQuestsResult")
      ).label("UserResponsesToQuestsResponse")
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
        responseId: questsResponseIdSchema.required()
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
        responseId: questsResponseIdSchema.required()
      }).label('RejectInvitationParams'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
