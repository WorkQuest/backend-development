import { error, output } from "../utils";

export async function mapPoints(r) {
  let where = `WHERE st_within("locationPostGIS", st_makeenvelope(:northLongitude, :northLatitude, :southLongitude, :southLatitude, 4326))) LC
    GROUP BY cid
    Order BY cid) LC;`;

  let query = `
  SELECT
       count as pointsCount,
       id as questId,
       case when LC.count = 1 then 'point' else 'cluster' end as type,
       array [st_x(center), st_y(center)] as coordinates,
       cluster_radius as clusterRadius 
       FROM (SELECT
       st_centroid(st_collect(location)) as center,
      case when cast(count(id) AS INT) = 1 then string_agg(cast(id AS VARCHAR), ',') end as id,
      cast(count(id) AS INTEGER) as count,
      case
          when cast(count(id) AS INT) != 1 then sqrt(
              st_area(st_minimumboundingcircle(st_collect(LC.location))) / pi())
          end as cluster_radius
    FROM
    (SELECT
        id,
        "locationPostGIS" AS location,
        st_clusterdbscan("locationPostGIS", abs(:northLatitude - :southLatitude) / 20, 1) over () AS cid
    FROM public."Quests"
    ${where}`;

  const [results, metadata] = await r.server.app.db.query(query, {
    replacements: {
      northLongitude: r.query.north.longitude,
      northLatitude: r.query.north.latitude,
      southLongitude: r.query.south.longitude,
      southLatitude: r.query.south.latitude,
    }
  });

  return output(results);
}
