import { BlockchainNetworks, WqtWbnbBlockInfo, WqtWbnbSwapEvent } from "@workquest/database-models/lib/models";
import BigNumber from "bignumber.js";
import {Coin, TokenPriceProvider, Web3Provider} from "../providers/types";
import {WqtWbnbEvent} from "./types";
import {EventData} from "web3-eth-contract";

export class WqtWbnbController {
  constructor (
    private readonly web3Provider: Web3Provider,
    private readonly tokenPriceProvider: TokenPriceProvider,
  ) {
    this.web3Provider.subscribeOnEvents(async (eventData) => {
      await this.onEvent(eventData);
    });
  }

  private async onEvent(eventsData: EventData) {
    if (eventsData.event === WqtWbnbEvent.Swap) {
      await this.swapEventHandler(eventsData);
    }
  }

  protected async swapEventHandler(eventsData: EventData) {
    const block = await this.web3Provider.web3.eth.getBlock(eventsData.blockNumber);

    const tokenPriceInUsd = eventsData.returnValues.amount0Out !== '0' ?
      await this.getTokenPriceInUsd(block.timestamp as string, Coin.BNB, parseInt(eventsData.returnValues.amount0Out)) :
      await this.getTokenPriceInUsd(block.timestamp as string, Coin.WQT, parseInt(eventsData.returnValues.amount1Out))

    const usdAmount = new BigNumber(tokenPriceInUsd).shiftedBy(-18);

    await WqtWbnbSwapEvent.findOrCreate({
      where: { transactionHash: eventsData.transactionHash },
      defaults: {
        timestamp: block.timestamp,
        totalUSD: usdAmount.toString(),
        blockNumber: eventsData.blockNumber,
        account: eventsData.returnValues.to,
        transactionHash: eventsData.transactionHash,
        bnbAmountOut: eventsData.returnValues.amount0In,
        wqtAmountOut: eventsData.returnValues.amount1In,
        bnbAmountIn: eventsData.returnValues.amount0Out,
        wqtAmountIn: eventsData.returnValues.amount1Out,
      }
    });

    await WqtWbnbBlockInfo.update({ lastParsedBlock: eventsData.blockNumber }, {
      where: { network: BlockchainNetworks.bscMainNetwork }
    });
  }

  private async getTokenPriceInUsd(timestamp: string | number, coin: Coin, coinAmount: number): Promise<number> {
    return await this.tokenPriceProvider.coinPriceInUSD(timestamp, coin) * coinAmount;
  }

  public async collectAllUncollectedEvents(lastBlockNumber: number) {
    const { collectedEvents, isGotAllEvents } = await this.web3Provider.getAllEvents(lastBlockNumber);

    for (const event of collectedEvents) {
      try {
        await this.onEvent(event);
      } catch (e) {
        console.error("Failed to process all events. Last processed block: " + event.blockNumber);
        throw e;
      }
    }

    if (!isGotAllEvents) {
      throw new Error("Failed to process all events. Last processed block: " + collectedEvents[collectedEvents.length - 1]);
    }
  }
}
