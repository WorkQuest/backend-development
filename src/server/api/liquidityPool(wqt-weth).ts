import { output } from '../utils';
import {
  WqtWethMintEvent,
  WqtWethBurnEvent,
  WqtWethSwapEvent,
  DailyLiquidityWqtWeth,
} from '@workquest/database-models/lib/models';

export async function getMints(r) {
  const { count, rows } = await WqtWethMintEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, mints: rows });
}

export async function getBurns(r) {
  const { count, rows } = await WqtWethBurnEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, burn: rows });
}

export async function getSwaps(r) {
  const { count, rows } = await WqtWethSwapEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getTokenDayData(r) {
  const { count, rows } = await DailyLiquidityWqtWeth.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['date', 'DESC']],
  });

  return output({ count, data: rows });
}
