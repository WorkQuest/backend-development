import Joi = require("joi");
import { locationSchema, outputOkSchema } from '../../schemes';
import { listMapPoints, mapPoints } from '../../api/map';
import { questPrioritySchema, questIdSchema, questSchema, questStatusSchema } from '../../schemes/quest';
import { questsListSortSchema } from './quest';

const mapPointOutputScheme = Joi.object({
  pointsCount: Joi.number(),
  questId: questIdSchema,
  type: Joi.string(),
  coordinates: Joi.array().items(Joi.number()),
  clusterRadius: Joi.number().allow(null),
}).label('MapPointOutputScheme');

export default [{
  method: "GET",
  path: "/v1/quests/map/points",
  handler: mapPoints,
  options: {
    id: "v1.map.points",
    tags: ["api", "map"],
    description: "Get points in map",
    validate: {
      query: Joi.object({
        north: locationSchema.label('NorthLocation').required(),
        south: locationSchema.label('SouthLocation').required(),
        q: Joi.string().default(null).max(255),
        priority: questPrioritySchema,
        status: questStatusSchema,
      }).label('MapPointsQueryScheme'),
    },
    response: {
      schema: outputOkSchema(Joi.array().items(mapPointOutputScheme)).label('MapPointsOutputResponse'),
    }
  }
}, {
  method: "GET",
  path: "/v1/quests/map/list-points",
  handler: listMapPoints,
  options: {
    id: "v1.map.points.list",
    tags: ["api", "map"],
    description: "Get list points in map",
    validate: {
      query: Joi.object({
        north: locationSchema.label('NorthLocation').required(),
        south: locationSchema.label('SouthLocation').required(),
        q: Joi.string().default(null).max(255),
        priority: questPrioritySchema,
        status: questStatusSchema,
        sort: questsListSortSchema
      }).label('ListPointsQueryScheme'),
    },
    response: {
      schema: outputOkSchema(Joi.array().items(questSchema)).label('ListMapPointsOutputResponse'),
    }
  }
}];
