import { error, output } from "../utils";
import { Point } from "../models/Point";
import { Errors } from "../utils/errors";

export async function getAllPoints() {
  return output(await Point.findAll());
}

export async function addPoint(r) {
  const point = await Point.create({
    latitude: r.payload.latitude,
    longitude: r.payload.longitude,
    text: r.payload.text
  });

  return output(point);
}

export async function delPoint(r) {
  let point = await Point.findByPk(r.params.pointId);
  if (!point)
    return error(Errors.NotFound, "Point not found", {});

  await point.destroy({ force: true });

  return output();
}
