import { DailyLiquidity } from "@workquest/database-models/lib/models";

export async function getLiquidity(r) {
  const { count, rows } = await DailyLiquidity.findAndCountAll({limit: r.query.limit, offset: r.query.offset})
  return({count, dailyLiquidity: rows});
}

