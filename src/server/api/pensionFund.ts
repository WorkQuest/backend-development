import { output } from '../utils';
import {
  PensionFundReceivedEvent,
  PensionFundWithdrewEvent,
  PensionFundWalletUpdatedEvent,
} from "@workquest/database-models/lib/models";

export async function getWalletUpdate(r) {
  const where = { };

  if (r.query.userAddress) {
    where['user'] = r.query.userAddress.toLowerCase();
  }

  const { count, rows } = await PensionFundWalletUpdatedEvent.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', r.query.sort.timestamp]],
  });

  return output({ count, events: rows });
}

export async function getReceive(r) {
  const where = { };

  if (r.query.userAddress) {
    where['user'] = r.query.userAddress.toLowerCase();
  }

  const { count, rows } = await PensionFundReceivedEvent.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', r.query.sort.timestamp]],
  });

  return output({ count, events: rows });
}

export async function getWithdraw(r) {
  const where = { };

  if (r.query.userAddress) {
    where['user'] = r.query.userAddress.toLowerCase();
  }

  const { count, rows } = await PensionFundWithdrewEvent.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', r.query.sort.timestamp]],
  });

  return output({ count, events: rows });
}
