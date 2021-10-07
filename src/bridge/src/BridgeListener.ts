import { BridgeContract } from "./BridgeContract";
import {
  BlockchainNetworks,
  BridgeParserBlockInfo,
  BridgeSwapTokenEvent,
  SwapEvents,
} from "@workquest/database-models/lib/models";

export enum TrackedEvents {
  swapInitialized = "SwapInitialized",
  swapRedeemed = "SwapRedeemed",
}

abstract class BridgeListener {
  protected readonly _contract: BridgeContract;

  protected constructor(contract: BridgeContract) {
    this._contract = contract;
  }

  protected abstract _parseSwapInitializedEvent(data: any): Promise<void>;
  protected abstract _parseSwapRedeemedEvent(data: any): Promise<void>;

  public async preParseSwaps() {
    for await (const events of this._contract.preParsingEvents()) {
      for (const event of events) await this._onEvent(event);
    }
  }

  protected async _onEvent(eventData: any): Promise<void> {
    if (eventData.event === TrackedEvents.swapInitialized) {
      await this._parseSwapInitializedEvent(eventData);
    } else if (eventData.event === TrackedEvents.swapRedeemed) {
      await this._parseSwapRedeemedEvent(eventData);
    }
  }

  startListen() {
    this._contract.signCallbackOnEvent(eventData => this._onEvent(eventData));
  }
}

export class BridgeBscListener extends BridgeListener {
  constructor(contract: BridgeContract) {
    super(contract);
  }

  protected async _parseSwapInitializedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.findOrCreate({
      where: {
        transactionHash: data.transactionHash,
        network: BlockchainNetworks.bscMainNetwork, // TODO
      },
      defaults: {
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
      }
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.bscMainNetwork }
    });
  }

  protected async _parseSwapRedeemedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.findOrCreate({
      where: {
        transactionHash: data.transactionHash,
        network: BlockchainNetworks.bscMainNetwork, // TODO
      },
      defaults: {
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
      }
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
    await BridgeSwapTokenEvent.findOrCreate({
      where: {
        transactionHash: data.transactionHash,
        network: BlockchainNetworks.ethMainNetwork, // TODO
      },
      defaults: {
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
      }
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.ethMainNetwork }
    });
  }

  protected async _parseSwapRedeemedEvent(data: any): Promise<void> {
    await BridgeSwapTokenEvent.findOrCreate({
      where: {
        transactionHash: data.transactionHash,
        network: BlockchainNetworks.ethMainNetwork, // TODO
      },
      defaults: {
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
      }
    });

    await BridgeParserBlockInfo.increment('lastParsedBlock', {
      where: { network: BlockchainNetworks.ethMainNetwork }
    });
  }
}
