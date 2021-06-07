import Joi = require("joi");
import { outputOkSchema, locationSchema, searchSchema, idSchema } from '../../schemes';
import { listMapPoints, mapPoints } from '../../api/map';
import { questSchema, questPrioritySchema, questsListSortSchema, questStatusSchema } from '../../schemes/quest';

const mapPointOutputSchema = Joi.object({
  pointsCount: Joi.number().label('PointsCount'),
  questId: idSchema.label('QuestId'),
  type: Joi.string().valid('point', 'cluster').label('TypePoint'),
  coordinates: Joi.array().example([83.1123, 40.221]).items(Joi.number()).label('Coordinates'),
  clusterRadius: Joi.number().allow(null).label('ClusterRadius'),
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
        north: locationSchema.required().label('NorthLocation'),
        south: locationSchema.required().label('SouthLocation'),
        q: searchSchema,
        priority: questPrioritySchema,
        status: questStatusSchema,
      }).label('MapPointsQueryScheme'),
    },
    response: {
      schema: outputOkSchema(Joi.array().items(mapPointOutputSchema).label('MapPoints')).label('MapPointsOutputResponse'),
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
        q: searchSchema,
        priority: questPrioritySchema,
        status: questStatusSchema,
        sort: questsListSortSchema,
      }).label('ListPointsQueryScheme'),
    },
    response: {
      schema: outputOkSchema(Joi.array().items(questSchema)).label('ListMapPointsOutputResponse'),
    }
  }
}];
