import { BridgeContract } from "./BridgeContract";
import {
  BlockchainNetworks,
  BridgeParserBlockInfo,
  BridgeSwapTokenEvent,
  SwapEvents
} from "@workquest/database-models/lib/models";

export enum TrackedEvents {
  swapInitialized = "SwapInitialized",
  swapRedeemed = "SwapRedeemed",
}

abstract class BridgeListener {
  private readonly _contract: BridgeContract;

  protected constructor(contract: BridgeContract) {
    this._contract = contract;
  }

  protected abstract _parseSwapInitializedEvent(data: any): Promise<void>;
  protected abstract _parseSwapRedeemedEvent(data: any): Promise<void>;

  protected async _onEvent(data: any): Promise<void> {
    if (data.event === TrackedEvents.swapInitialized) {
      return this._parseSwapInitializedEvent(data);
    } else if (data.event === TrackedEvents.swapRedeemed) {
      return this._parseSwapRedeemedEvent(data);
    }
  }

  startListen() {
    this._contract.signCallbackOnEvent(this._onEvent);
  }
}

export class BridgeBnbListener extends BridgeListener {

  constructor(contract: BridgeContract) {
    super(contract);
  }

  protected async _parseSwapInitializedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.create({
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      network: BlockchainNetworks.bscMainNetwork, // TODO
      event: SwapEvents.swapInitialized,
      messageHash: data.messageHash,
      nonce: data.nonce,
      timestamp: data.timestamp,
      initiator: data.sender.toLowerCase(),
      recipient: data.recipient.toLowerCase(),
      amount: data.amount,
      chainTo: data.chainTo,
      chainFrom: data.chainFrom,
      symbol: data.symbol,
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.bscMainNetwork }
    });
  }

  protected async _parseSwapRedeemedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.create({
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      network: BlockchainNetworks.bscMainNetwork, // TODO
      event: SwapEvents.swapRedeemed,
      messageHash: data.messageHash,
      nonce: data.nonce,
      timestamp: data.timestamp,
      initiator: data.sender.toLowerCase(),
      recipient: data.recipient.toLowerCase(),
      amount: data.amount,
      chainTo: data.chainTo,
      chainFrom: data.chainFrom,
      symbol: data.symbol,
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.bscMainNetwork }
    });
  }
}

export class BridgeEthListener extends BridgeListener {

  constructor(contract: BridgeContract) {
    super(contract);
  }

  protected async _parseSwapInitializedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.create({
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      network: BlockchainNetworks.ethMainNetwork, // TODO
      event: SwapEvents.swapInitialized,
      messageHash: data.messageHash,
      nonce: data.nonce,
      timestamp: data.timestamp,
      initiator: data.sender.toLowerCase(),
      recipient: data.recipient.toLowerCase(),
      amount: data.amount,
      chainTo: data.chainTo,
      chainFrom: data.chainFrom,
      symbol: data.symbol,
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.ethMainNetwork }
    });
  }

  protected async _parseSwapRedeemedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.create({
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      network: BlockchainNetworks.ethMainNetwork, // TODO
      event: SwapEvents.swapRedeemed,
      messageHash: data.messageHash,
      nonce: data.nonce,
      timestamp: data.timestamp,
      initiator: data.sender.toLowerCase(),
      recipient: data.recipient.toLowerCase(),
      amount: data.amount,
      chainTo: data.chainTo,
      chainFrom: data.chainFrom,
      symbol: data.symbol,
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.ethMainNetwork }
    });
  }
}
