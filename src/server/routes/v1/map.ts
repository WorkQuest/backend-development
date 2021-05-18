import Joi = require("joi");
import { emptyOkSchema, locationSchema } from '../../schemes';

const mapPointsQueryScheme = Joi.object({
  north: locationSchema.label('NorthLocation').required(),
  south: locationSchema.label('SouthLocation').required(),
}).label("MapPointsQueryScheme");

export default [{
  method: "GET",
  path: "/v1/quests/",
  // handler: ,
  options: {
    id: "v1.",
    tags: ["api", "map"],
    description: "",
    validate: mapPointsQueryScheme,
    response: {
      schema: emptyOkSchema//outputOkSchema().label("MapGetPointsResponse")
    }
  }
}];
