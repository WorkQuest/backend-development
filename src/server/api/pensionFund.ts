import { output } from '../utils';
import { ClaimedEvent, ReceivedEvent, WithdrewEvent } from "@workquest/database-models/lib/models";

export async function getClaim(r) {
  const { count, rows } = await ClaimedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getReceive(r) {
  const { count, rows } = await ReceivedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}

export async function getWithdraw(r) {
  const { count, rows } = await WithdrewEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, swaps: rows });
}
