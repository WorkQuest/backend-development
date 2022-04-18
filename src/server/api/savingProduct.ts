import { SavingProductReceivedEvent, Wallet } from "@workquest/database-models/lib/models";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";

export async function getReceivedEvents(r) {
  const wallet = await Wallet.findOne({
    where: { userId: r.auth.credentials.id }
  });

  if (!wallet) {
    return error(Errors.NotFound, 'User does not have a wallet', {});
  }

  const { count, rows } = await SavingProductReceivedEvent.findAndCountAll({
    attributes: {
      exclude: ['id', 'createdAt', 'updatedAt'],
    },
    where: { user: wallet.address },
    order: [['timestamp', 'DESC']],
    offset: r.query.offset,
    limit: r.query.limit,
  });

  return output({ count, events: rows });
}
