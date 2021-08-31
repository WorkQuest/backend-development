import { output } from "../utils";
import { searchFields } from './quest';

function makeWhere(query) {
  const like = query.q ? ` LIKE '%${query.q}%' ` : '';

  return `WHERE st_within("locationPostGIS", st_makeenvelope(:northLongitude, :northLatitude, :southLongitude, :southLatitude, 4326))
  ${query.priority ? ' AND priority=' + query.priority : ''}
  ${query.status ? ' AND status=' + query.status : ''}
  ${query.q ? ' AND ' + searchFields.join(like + ' OR ') + like : ''}`;
}

function makeOrderBy(sort) {
  let order = ' ORDER BY ';
  let byFields = [];

  for (const [column, sortBy] of Object.entries(sort)) {
    byFields.push(`"${column}" ${sortBy}`);
  }

  return order + byFields.join(', ');
}

export async function mapPoints(r) {
  let where = makeWhere(r);
  let query = `
  SELECT
       count as pointsCount,
       id as questId,
       status as questStatus,
       price as questPrice,
       firstName as userFirstName,
       lastName as userLastName,
       avatarUrl as userAvatarUrl,
       priority as questPriority,
       case when LC.count = 1 then 'point' else 'cluster' end as type,
       array [st_x(center), st_y(center)] as coordinates,
       cluster_radius as clusterRadius 
       FROM (SELECT
       st_centroid(st_collect(location)) as center,
      case when cast(count(id) AS INT) = 1 then string_agg(cast(id AS VARCHAR), ',') end as id,
      case when cast(count(status) AS INT) = 1 then string_agg(cast(status AS VARCHAR), ',') end as status,
      case when cast(count(priority) AS INT) = 1 then string_agg(cast(priority AS VARCHAR), ',') end as priority,
      case when cast(count(firstName) AS INT) = 1 then string_agg(cast(firstName AS VARCHAR), ',') end as firstName,
      case when cast(count(lastName) AS INT) = 1 then string_agg(cast(lastName AS VARCHAR), ',') end as lastName,
      case when cast(count(avatarUrl) AS INT) = 1 then string_agg(cast(avatarUrl AS VARCHAR), ',') end as avatarUrl,
      case when cast(count(price) AS INT) = 1 then string_agg(cast(price AS VARCHAR), ',') end as price,
      cast(count(id) AS INTEGER) as count,
      case
          when cast(count(id) AS INT) != 1 then sqrt(
              st_area(st_minimumboundingcircle(st_collect(LC.location))) / pi())
          end as cluster_radius
    FROM
    (SELECT
        id,
        status,
        priority,
        price,
        "user->avatar"."url" as avatarUrl,
        "firstName" as firstName,
        "lastName" as lastName,
        "locationPostGIS" AS location,
        st_clusterdbscan("locationPostGIS", abs(:northLatitude - :southLatitude) / 20, 1) over () AS cid
    FROM public."Quests"
    LEFT OUTER JOIN (SELECT "id" as "user.id", "firstName", "lastName", "avatarId" FROM "Users") AS "user" ON "Quests"."userId" = "user"."user.id"  
    LEFT OUTER JOIN (SELECT "id" as "avatar.id", "url" FROM "Media") AS "user->avatar" ON "user"."avatarId" = "user->avatar"."avatar.id"
    ${where}) LC
    GROUP BY cid
    Order BY cid) LC;`;

  const [results, ] = await r.server.app.db.query(query, {
    replacements: {
      northLongitude: r.query.north.longitude,
      northLatitude: r.query.north.latitude,
      southLongitude: r.query.south.longitude,
      southLatitude: r.query.south.latitude,
    }
  });

  console.log(results);

  return output(results);
}

export async function listMapPoints(r) {
  let where = makeWhere(r);
  let order = r.query.sort ? makeOrderBy(r.query.sort) : '';
  let query = `
  SELECT 
    id, "userId", status,
    priority, category, location,
    title, description, price,
    "adType", "createdAt", "updatedAt"
  FROM public."Quests"
  ${where}
  ${order}`;

  const [results, ] = await r.server.app.db.query(query, {
    replacements: {
      northLongitude: r.query.north.longitude,
      northLatitude: r.query.north.latitude,
      southLongitude: r.query.south.longitude,
      southLatitude: r.query.south.latitude,
    }
  });

  return output({ quests: results });
}
