import Joi = require('joi');
import { listMapPoints, mapPoints } from '../../api/map';
import {
  outputOkSchema,
  mapPointsSchema,
  locationSchema,
  searchSchema,
  prioritySchema,
  questsListSortSchema,
  questStatusSchema,
  questsSchema,
} from '@workquest/database-models/lib/schemes';

export default [
  {
    method: 'GET',
    path: '/v1/quests/map/points',
    handler: mapPoints,
    options: {
      auth: 'jwt-access',
      id: 'v1.map.points',
      tags: ['api', 'map'],
      description: 'Get points in map',
      validate: {
        query: Joi.object({
          north: locationSchema.required().label('NorthLocation'),
          south: locationSchema.required().label('SouthLocation'),
          q: searchSchema,
          priority: prioritySchema,
          status: questStatusSchema,
        }).label('MapPointsQuery'),
      },
      response: {
        schema: outputOkSchema(mapPointsSchema).label('MapPointsResponse'),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/quests/map/list-points',
    handler: listMapPoints,
    options: {
      auth: 'jwt-access',
      id: 'v1.map.points.list',
      tags: ['api', 'map'],
      description: 'Get list points in map (Old - use get quests)',
      validate: {
        query: Joi.object({
          north: locationSchema.label('NorthLocation').required(),
          south: locationSchema.label('SouthLocation').required(),
          q: searchSchema,
          priority: prioritySchema,
          status: questStatusSchema,
          sort: questsListSortSchema.default(null),
        }).label('ListPointsQuery'),
      },
      response: {
        schema: outputOkSchema(questsSchema).label('ListPointsResponse'),
      },
    },
  },
];
