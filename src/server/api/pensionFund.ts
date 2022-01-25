import { output } from '../utils';
import { PensionFundClaimedEvent, PensionFundReceivedEvent, PensionFundWithdrewEvent } from "@workquest/database-models/lib/models";

export async function getClaim(r) {
  const { count, rows } = await PensionFundClaimedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getReceive(r) {
  const { count, rows } = await PensionFundReceivedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getWithdraw(r) {
  const { count, rows } = await PensionFundWithdrewEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}
