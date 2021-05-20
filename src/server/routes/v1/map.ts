import Joi = require("joi");
import { locationSchema, outputOkSchema } from '../../schemes';
import { mapPoints } from '../../api/map';
import { questIdSchema } from '../../schemes/quest';

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
      }),
    },
    response: {
      schema: outputOkSchema(Joi.array().items(mapPointOutputScheme)).label('MapPointsOutputResponse'),
    }
  }
}];
