import { output } from "../utils";
import { searchFields } from './quest';
import { Quest, QuestsResponse, QuestsResponseType, StarredQuests, User } from "@workquest/database-models/lib/models";
import { literal, Op } from "sequelize";
import * as sequelize from "sequelize"
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
    ${where}) LC
    GROUP BY cid
    Order BY cid) LC;`;

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

export async function listMapPoints(r) {
  // let where = makeWhere(r);
  // let order = r.query.sort ? makeOrderBy(r.query.sort) : '';
  // let query = `
  // SELECT
  //   id, "userId", status,
  //   priority, category, location,
  //   title, description, price,
  //   "adType", "createdAt", "updatedAt"
  // FROM
  // (SELECT * FROM public."Users" WHERE "Quests"."userId" = "Users".id)
  // public."Quests"
  // ${where}
  // ${order}`;
  //
  //
  // const [results, ] = await r.server.app.db.query(query, {
  //   replacements: {
  //     northLongitude: r.query.north.longitude,
  //     northLatitude: r.query.north.latitude,
  //     southLongitude: r.query.south.longitude,
  //     southLatitude: r.query.south.latitude,
  //   }
  // });
  const order = [];
  const include = [];
  const where = {
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id } ),
    ...(r.query.priority && { priority: r.query.priority }),
    ...(r.query.status && { status: r.query.status }),
    ...(r.query.adType && {adType: r.query.adType}),
    ...(r.params.userId && { userId: r.params.userId }),
    [Op.and]: sequelize.literal(`st_within("locationPostGIS", st_makeenvelope(${r.query.north.longitude}, ${r.query.north.latitude}, ${r.query.south.longitude}, ${r.query.south.latitude}, 4326))`)
  };

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${r.query.q}%`
      }
    }))
  }
  if (r.query.invited) {
    include.push({
      model: QuestsResponse,
      attributes: [],
      where: {
        [Op.and]: [
          { workerId: r.auth.credentials.id },
          { type: QuestsResponseType.Invite },
        ]
      }
    });
  }
  if (r.query.starred) {
    include.push({
      model: StarredQuests,
      as: 'starredQuests',
      where: { userId: r.auth.credentials.id },
      attributes: [],
    });
  }

  include.push({
    model: StarredQuests,
    as: "star",
    where: { userId: r.auth.credentials.id },
    required: false
  });

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    include, order, where
  });

  return output({count, quests: rows});
}
