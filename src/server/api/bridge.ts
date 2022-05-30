import { output } from '../utils';
import configBridge from '../config/config.bridge';
import { SwapEvents, BridgeSwapTokenEvent } from '@workquest/database-models/lib/models';

export async function getRecipientSwaps(r) {
  const swaps = [];
  const recipient = r.params.recipient.toLowerCase();

  const redeemedEvents = await BridgeSwapTokenEvent.findAll({
    where: {
      ...(r.query.symbol && { symbol: r.query.symbol }),
      event: SwapEvents.swapRedeemed,
      recipient,
    },
  });

  const { count, rows } = await BridgeSwapTokenEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']],
    where: {
      ...(r.query.symbol && { symbol: r.query.symbol }),
      event: SwapEvents.swapInitialized,
      recipient,
    },
  });

  for (const swapEvent of rows) {
    const data = r.server.app.web3.utils.soliditySha3(
      swapEvent.nonce,
      swapEvent.amount,
      swapEvent.recipient,
      swapEvent.chainFrom,
      swapEvent.chainTo,
      swapEvent.symbol,
    );
    const sing = await r.server.app.web3.eth.accounts.sign(data, configBridge.privateKey);
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
        /** Не трогать последовательность! Метод redeem на контракте */
        swapEvent.nonce.toString(),
        swapEvent.chainFrom.toString(),
        swapEvent.amount,
        swapEvent.recipient,
        sing.v,
        sing.r,
        sing.s,
        swapEvent.symbol,
      ],
    });
  }

  return output({ count, swaps });
}
