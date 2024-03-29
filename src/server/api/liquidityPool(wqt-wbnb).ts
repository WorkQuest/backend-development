import { output } from '../utils';
import {
  WqtWbnbMintEvent,
  WqtWbnbBurnEvent,
  WqtWbnbSwapEvent,
  DailyLiquidityWqtWbnb,
} from '@workquest/database-models/lib/models';

export async function getMints(r) {
  const { count, rows } = await WqtWbnbMintEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, mints: rows });
}

export async function getBurns(r) {
  const { count, rows } = await WqtWbnbBurnEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, burn: rows });
}

export async function getSwaps(r) {
  const { count, rows } = await WqtWbnbSwapEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, data: rows });
}

export async function getTokenDayData(r) {
  const { count, rows } = await DailyLiquidityWqtWbnb.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['date', 'DESC']],
  });

  return output({ count, data: rows });
}
