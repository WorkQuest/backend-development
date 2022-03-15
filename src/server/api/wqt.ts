import { Wallet, WqtDelegateVotesChangedEvent } from "@workquest/database-models/lib/models";
import { output } from "../utils";

export async function getDelegateVotesChangedEventWqt(r) {
  const { address } = await Wallet.findOne({
    where: { userId: r.auth.credentials.id }
  });

  const event = await WqtDelegateVotesChangedEvent.findAndCountAll({
    where: { delegator: address.toLowerCase() },
    // order: [['blockNumber', 'DESC']],
    // group: ['blockNumber', 'delegate']
  });

  return output(event);
}
