import * as Joi from 'joi';
import * as handlers from '../../api/questsResponse';
import {
  idSchema,
  idsSchema,
  chatSchema,
  offsetSchema,
  limitSchema,
  emptyOkSchema,
  outputOkSchema,
  questsResponseMessageSchema,
  questsResponsesWithCountSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  // {
  //   method: 'POST',
  //   path: '/v1/quest/{questId}/response',
  //   handler: handlers.responseOnQuest,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.response',
  //     tags: ['api', 'quest-response'],
  //     description: 'Respond on quest',
  //     validate: {
  //       params: Joi.object({
  //         questId: idSchema.required(),
  //       }).label('QuestResponseParams'),
  //       payload: Joi.object({
  //         message: questsResponseMessageSchema.allow(''),
  //         medias: idsSchema.required().unique(),
  //       }).label('QuestResponsePayload'),
  //     },
  //     response: {
  //       schema: outputOkSchema(chatSchema).label('ResponseOnQuestResponse'),
  //     },
  //   },
  // },
  // {
  //   method: 'POST',
  //   path: '/v1/quest/{questId}/invite',
  //   handler: handlers.inviteOnQuest,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.invite',
  //     tags: ['api', 'quest-response'],
  //     description: 'Invite on quest',
  //     validate: {
  //       params: Joi.object({
  //         questId: idSchema.required(),
  //       }).label('QuestInviteParams'),
  //       payload: Joi.object({
  //         invitedUserId: idSchema.required(),
  //         message: questsResponseMessageSchema.allow(''),
  //       }).label('QuestInvitePayload'),
  //     },
  //     response: {
  //       schema: outputOkSchema(chatSchema).label('InviteOnQuestResponse'),
  //     },
  //   },
  // },
  {
    method: 'GET',
    path: '/v1/quest/{questId}/responses',
    handler: handlers.userResponsesToQuest,
    options: {
      auth: 'jwt-access',
      id: 'v1.quest.responses',
      tags: ['api', 'quest-response'],
      description: 'Get responses to quest',
      validate: {
        query: Joi.object({
          offset: offsetSchema,
          limit: limitSchema,
        }).label('ResponsesToQuestQuery'),
        params: Joi.object({
          questId: idSchema.required(),
        }).label('ResponsesToQuestParams'),
      },
      response: {
        schema: outputOkSchema(questsResponsesWithCountSchema).label('ResponsesToQuestResponse'),
      },
    },
  },
  // {
  //   method: 'GET',
  //   path: '/v1/quest/responses/my',
  //   handler: handlers.responsesToQuestsForUser,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.responses.my',
  //     tags: ['api', 'quest-response'],
  //     description: 'Get responses to quest for authorized user',
  //     validate: {
  //       query: Joi.object({
  //         offset: offsetSchema,
  //         limit: limitSchema,
  //       }).label('ResponsesToQuestsQuery'),
  //     },
  //     response: {
  //       schema: outputOkSchema(questsResponsesWithCountSchema).label('ResponsesToQuestsResponse'),
  //     },
  //   },
  // },
  // {
  //   method: 'POST',
  //   path: '/v1/quest/response/{responseId}/accept',
  //   handler: handlers.acceptInviteOnQuest,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.response.accept',
  //     tags: ['api', 'quest-response'],
  //     description: 'Accept quest invitation',
  //     validate: {
  //       params: Joi.object({
  //         responseId: idSchema.required(),
  //       }).label('AcceptInvitationParams'),
  //     },
  //     response: {
  //       schema: emptyOkSchema,
  //     },
  //   },
  // },
  // {
  //   method: 'POST',
  //   path: '/v1/quest/response/{responseId}/reject',
  //   handler: handlers.rejectInviteOnQuest,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.response.reject',
  //     tags: ['api', 'quest-response'],
  //     description: 'Reject quest invitation',
  //     validate: {
  //       params: Joi.object({
  //         responseId: idSchema.required(),
  //       }).label('RejectInvitationParams'),
  //     },
  //     response: {
  //       schema: emptyOkSchema,
  //     },
  //   },
  // },
  // {
  //   method: 'POST',
  //   path: '/v1/quest/employer/{responseId}/reject',
  //   handler: handlers.rejectResponseOnQuest,
  //   options: {
  //     auth: 'jwt-access',
  //     id: 'v1.quest.response.rejectResponseOnQuest',
  //     tags: ['api', 'quest-response'],
  //     description: 'Reject the answer to the quest',
  //     validate: {
  //       params: Joi.object({
  //         responseId: idSchema.required(),
  //       }).label('RejectResponseOnQuestParams'),
  //     },
  //     response: {
  //       schema: emptyOkSchema,
  //     },
  //   },
  // },
];
