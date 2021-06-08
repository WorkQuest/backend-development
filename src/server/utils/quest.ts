import { Location } from '../models/Quest';

export function transformToGeoPostGIS(location: Location) {
  const coordinates = [location.longitude, location.latitude];

  return {
    type: "Point",
    coordinates: coordinates,
    crs: { type: "name", properties: { name: "EPSG:4326" } }
  };
}
