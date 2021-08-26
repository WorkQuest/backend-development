import Joi = require("joi");
import { listMapPoints, mapPoints } from '../../api/map';
import {
  outputOkSchema,
  mapPointsSchema,
  locationSchema,
  searchSchema,
  questPrioritySchema,
  questsListSortSchema,
  questStatusSchema,
  questsSchema, questFullSchema,
  limitSchema, offsetSchema, questsQuerySchema
} from "@workquest/database-models/lib/schemes";

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
      }).label('MapPointsQuery'),
    },
    response: {
      schema: outputOkSchema(mapPointsSchema).label('MapPointsResponse'),
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
      query: questsQuerySchema
    },
    response: {
      schema: outputOkSchema(questFullSchema).label('QuestsResponse'),
    }
  }
}];
