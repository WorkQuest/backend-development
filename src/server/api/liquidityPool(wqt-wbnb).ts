import { output } from '../utils';
import {
  DailyLiquidity,
  WqtWbnbMintEvent,
  WqtWbnbSwapEvent,
} from '@workquest/database-models/lib/models';

export async function getMints(r) {
  const { count, rows } = await WqtWbnbMintEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, mints: rows });
}

export async function getSwaps(r) {
  const { count, rows } = await WqtWbnbSwapEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getTokenDayData(r) {
  const { count, rows } = await DailyLiquidity.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['date', 'DESC']],
  });

  return output({ count, infoPer10Days: rows });
}
