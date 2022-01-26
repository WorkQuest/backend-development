import Joi = require("joi");
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
  searchByNorthAndSouthCoordinatesSchema,
} from "@workquest/database-models/lib/schemes"

export default [{
  method: "GET",
  path: "/v1/quests/map/points",
  handler: mapPoints,
  options: {
    auth: 'jwt-access',
    id: "v1.map.points",
    tags: ["api", "map"],
    description: "Get points in map",
    validate: {
      query: Joi.object({
        q: searchSchema,
        priority: prioritySchema,
        status: questStatusSchema,
        northAndSouthCoordinates: searchByNorthAndSouthCoordinatesSchema.required(),
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
    auth: 'jwt-access',
    id: "v1.map.points.list",
    tags: ["api", "map"],
    description: "Get list points in map (Old - use get quests)",
    validate: {
      query: Joi.object({
        q: searchSchema,
        priority: prioritySchema,
        status: questStatusSchema,
        sort: questsListSortSchema.default(null),
        northAndSouthCoordinates: searchByNorthAndSouthCoordinatesSchema.required(),
      }).label('ListPointsQuery'),
    },
    response: {
      schema: outputOkSchema(questsSchema).label('ListPointsResponse'),
    }
  }
}];
