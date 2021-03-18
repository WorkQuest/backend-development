import Joi = require("joi");

export const pointGeoSchema = Joi.string().regex(/^\d+(.\d+)?$/).example("30.1231").label("PointGeoSchema");
export const pointTextSchema = Joi.string().example("some text").label("PointTextSchema");
export const pointIdSchema = Joi.string().uuid().example("791c3cde-ec2b-4c76-8016-7f0c0e12b8d4").label("PointIdSchema");

export const pointObjectSchema = Joi.object({
  id: pointIdSchema,
  latitude: pointGeoSchema,
  longitude: pointGeoSchema,
  text: pointTextSchema
}).label("PointObjectSchema");

export const pointsArraySchema = Joi.array().items(pointObjectSchema).label("PointsArraySchema");
