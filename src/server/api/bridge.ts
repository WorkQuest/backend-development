import Web3 from "web3";
import configBridge from "../config/config.bridge";
import { output } from "../utils";
import {
  SwapEvents,
  BridgeSwapTokenEvent,
} from "@workquest/database-models/lib/models";

const linkWsProvider = configBridge.debug ?
  configBridge.bscTestNetwork.webSocketProvider : configBridge.bscMainNetwork.webSocketProvider;

const web3 = new Web3(new Web3.providers.WebsocketProvider(linkWsProvider));

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
    const sing = await web3.eth.accounts.sign(data, configBridge.privateKey);
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
      signData: [ /** Не трогать последовательность! Метод redeem на контракте */
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
