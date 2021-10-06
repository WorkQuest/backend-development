import {BlockTransactionInterface,} from "./processSwapInitialized";
import processMessageHashCreator from "./processMessageHashCreator";
import { BlockchainNetworks, BridgeSwapTokenEvent, SwapEvents } from "@workquest/database-models/lib/models";
import { UInt } from "../listeners/misc";


export interface swapRedeemedReadInterface extends BlockTransactionInterface {
  readonly timestamp: string
  readonly sender: string
  readonly recipient: string
  readonly amount: string
  readonly chainFrom: number
  readonly chainTo: number
  readonly nonce: number
  readonly symbol: string
}

interface SwapInterface {
  transactionHash: string;
  active: boolean,
  timestamp: string;
  initiator: string;
  recipient: string;
  amount: string;
  chainTo: number;
  chainFrom: number;
  token: string;
  blockNumber: number;
  nonce: number,
  messageHash: string
}

export default async (swapRedeemedData: swapRedeemedReadInterface, blockchainNetwork: BlockchainNetworks) => {
  try {
    const messageHash = await processMessageHashCreator(swapRedeemedData);

    const model: SwapInterface = {
      timestamp: swapRedeemedData.timestamp,
      active: true,
      initiator: swapRedeemedData.sender.toLowerCase(),
      recipient: swapRedeemedData.recipient.toLowerCase(),
      amount: swapRedeemedData.amount,
      chainTo: swapRedeemedData.chainTo,
      chainFrom: swapRedeemedData.chainFrom,
      token: swapRedeemedData.symbol,
      transactionHash: swapRedeemedData.transactionHash,
      blockNumber: swapRedeemedData.blockNumber,
      nonce: swapRedeemedData.nonce,
      messageHash: messageHash
    };

    return BridgeSwapTokenEvent.findOrCreate({
      where: {
        transactionHash: model.transactionHash,
        event: SwapEvents.swapRedeemed,
      },
      defaults: {
        transactionHash: model.transactionHash,
        blockNumber: model.blockNumber,
        network: blockchainNetwork,
        event: SwapEvents.swapRedeemed,
        nonce: model.nonce,
        timestamp: model.timestamp,
        initiator: model.initiator,
        recipient: model.recipient,
        amount: model.amount,
        chainTo: model.chainTo,
        chainFrom: model.chainFrom,
        symbol: model.token,
        messageHash
      }
    });
  } catch (e) {
    console.log('Error process event SwapRedeemed', e)
  }
}
