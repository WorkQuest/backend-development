import { output } from '../utils';
import {
  PensionFundReceivedEvent,
  PensionFundWithdrewEvent,
  PensionFundWalletUpdatedEvent,
} from "@workquest/database-models/lib/models";

export async function getWalletUpdate(r) {
  const { count, rows } = await PensionFundWalletUpdatedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, events: rows });
}

export async function getReceive(r) {
  const { count, rows } = await PensionFundReceivedEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, events: rows });
}

export async function getWithdraw(r) {
  const { count, rows } = await PensionFundWithdrewEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
  });

  return output({ count, events: rows });
}
