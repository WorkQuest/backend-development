import { output } from "../utils";
import { metaMaskKey, wsProviders } from "../config/constant";
import {
  SwapEvents,
  BridgeSwapTokenEvent,
} from "@workquest/database-models/lib/models";

const web3 = new (require("web3"))(wsProviders.bsc);

export async function getRecipientSwaps(r) {
  const recipient = r.params.recipient.toLowerCase();
  const swaps = [];

  const redeemedEvents = await BridgeSwapTokenEvent.findAll({
    where: {
      event: SwapEvents.swapRedeemed,
      recipient,
    }
  });

  const { count, rows } = await BridgeSwapTokenEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [
      ["timestamp", "DESC"]
    ],
    where: {
      event: SwapEvents.swapInitialized,
      recipient,
    }
  });

  for (const swapEvent of rows) {
    const data = web3.utils.soliditySha3(
      swapEvent.nonce,
      swapEvent.amount,
      swapEvent.recipient,
      swapEvent.chainFrom,
      swapEvent.chainTo,
      swapEvent.symbol,
    );
    const sing = await web3.eth.accounts.sign(data, metaMaskKey);
    const redeemedRowIndex = redeemedEvents.findIndex((row) => row.messageHash === swapEvent.messageHash);

    swaps.push({
      canRedeemed: redeemedRowIndex === -1,
      blockNumber: swapEvent.blockNumber,
      transactionHash: swapEvent.transactionHash,
      nonce: swapEvent.nonce,
      timestamp: swapEvent.timestamp,
      initiator: swapEvent.initiator,
      recipient: swapEvent.recipient,
      amount: swapEvent.amount,
      chainTo: swapEvent.chainTo,
      chainFrom: swapEvent.chainFrom,
      symbol: swapEvent.symbol,
      signData: [
        swapEvent.nonce.toString(),
        swapEvent.chainFrom.toString(),
        swapEvent.amount,
        swapEvent.recipient,
        sing.v, sing.r, sing.s,
        swapEvent.symbol,
      ],
    });
  }

  return output({ count, swaps });
}
