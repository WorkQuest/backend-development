import Joi = require("joi");
import { addPoint, delPoint, getAllPoints } from "../../api/map";
import { emptyOkSchema, outputOkSchema } from "../../schemes";
import {
  pointGeoSchema,
  pointIdSchema,
  pointObjectSchema,
  pointsArraySchema,
  pointTextSchema
} from "../../schemes/point";

export default [{
  method: "GET",
  path: "/v1/map/points",
  handler: getAllPoints,
  options: {
    id: "v1.map.getAllPoints",
    tags: ["api", "map"],
    description: "Get all map points",
    response: {
      schema: outputOkSchema(pointsArraySchema).label("MapGetAllPointsResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/map/point",
  handler: addPoint,
  options: {
    id: "v1.map.addPoint",
    tags: ["api", "map"],
    description: "Add point on map",
    validate: {
      payload: Joi.object({
        text: pointTextSchema,
        latitude: pointGeoSchema,
        longitude: pointGeoSchema
      }).label("MapAddPointPayload")
    },
    response: {
      schema: outputOkSchema(pointObjectSchema).label("MapAddPointResponse")
    }
  }
}, {
  method: "DELETE",
  path: "/v1/map/point/{pointId}",
  handler: delPoint,
  options: {
    id: "v1.map.deletePoint",
    tags: ["api", "map"],
    description: "Delete point from map",
    validate: {
      params: Joi.object({
        pointId: pointIdSchema
      }).label("MapDeletePointParams")
    },
    response: {
      schema: emptyOkSchema.label("MapDeletePointResponse")
    }
  }
}];
