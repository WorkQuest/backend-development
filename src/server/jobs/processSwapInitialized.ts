import { BlockchainNetworks, BridgeSwapTokenEvent, SwapEvents } from "@workquest/database-models/lib/models";
import processMessageHashCreator from "./processMessageHashCreator";


export interface BlockTransactionInterface {
  readonly blockNumber: number,
  readonly transactionHash: string,
  readonly signature: string,
}


export interface swapInitializedReadInterface extends BlockTransactionInterface {
  readonly timestamp: string
  readonly sender: string
  readonly recipient: string
  readonly amount: string
  readonly chainFrom: number
  readonly chainTo: number
  readonly nonce: number
  readonly symbol: string
}

export default async (swapInitializedData: swapInitializedReadInterface, blockchainNetwork: BlockchainNetworks) => {
  try {
    console.log(swapInitializedData, 'swapInitializedData');
    const messageHash = await processMessageHashCreator(swapInitializedData);

    const model: SwapInterface = {
      timestamp: swapInitializedData.timestamp,
      active: true,
      initiator: swapInitializedData.sender.toLowerCase(),
      recipient: swapInitializedData.recipient.toLowerCase(),
      amount: swapInitializedData.amount,
      chainTo: swapInitializedData.chainTo,
      chainFrom: swapInitializedData.chainFrom,
      token: swapInitializedData.symbol,
      transactionHash: swapInitializedData.transactionHash,
      blockNumber: swapInitializedData.blockNumber,
      nonce: swapInitializedData.nonce,
      messageHash: messageHash
    };
    console.log(model, 'model');
    try {
      await BridgeSwapTokenEvent.create({
        transactionHash: model.transactionHash,
        blockNumber: model.blockNumber,
        network: blockchainNetwork,
        event: SwapEvents.swapInitialized,
        nonce: model.nonce,
        timestamp: model.timestamp,
        initiator: model.initiator,
        recipient: model.recipient,
        amount: model.amount,
        chainTo: model.chainTo,
        chainFrom: model.chainFrom,
        symbol: model.token,
        messageHash,
      });
    } catch (err) {
      console.log(err);
    }
  } catch (e) {
    console.log('Error process event SwapInitialized', e)
  }
}

interface SwapInterface {
  transactionHash: string;
  active: boolean;
  timestamp: string;
  initiator: string;
  recipient: string;
  amount: string;
  chainTo: number;
  chainFrom: number;
  token: string;
  blockNumber: number;
  nonce: number;
  messageHash: string;
}
