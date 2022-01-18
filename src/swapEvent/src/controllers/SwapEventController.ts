import { Web3Helper } from "../providers/Web3Helper";
import {SwapEventWqtWbnb} from "@workquest/database-models/lib/models";
import { CoinGeckoProvider, Coins } from "../../../dailyLiquidity/src/providers/CoinGeckoProvider";
import BigNumber from "bignumber.js";

export type SwapEvent = {
  timestamp: string,
  blockNumber: string,
  totalUSD: string,
  bnbAmountOut: string,
  wqtAmountOut: string,
  bnbAmountIn: string,
  wqtAmountIn: string,
  account: string,
}

export class SwapEventController {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor (
    private readonly web3Helper: Web3Helper,
    private readonly contract: any,
  ) {
    this.web3Helper = web3Helper
    this.contract = contract
    this.coinGeckoProvider = new CoinGeckoProvider();
  }

  private async countUSD(timestamp: string, coin: Coins, coinAmount: number): Promise<number> {
    return await this.coinGeckoProvider.coinPriceInUSD(timestamp, coin) * coinAmount;
  }

  private async processEvent(event: any): Promise<SwapEvent> {
    const blockInfo = await this.web3Helper.web3.eth.getBlock(event.blockNumber);
    const usdDecimal: number = event.returnValues.amount0Out !== '0' ?
      await this.countUSD(blockInfo.timestamp, Coins.BNB, Number(event.returnValues.amount0Out)) :
      await this.countUSD(blockInfo.timestamp, Coins.WQT, Number(event.returnValues.amount1Out));

    const usdAmount = new BigNumber(usdDecimal).shiftedBy(-18)

    return {
      timestamp: blockInfo.timestamp,
      blockNumber: event.blockNumber,
      totalUSD: usdAmount.toString(),
      bnbAmountOut: event.returnValues.amount0In,
      wqtAmountOut: event.returnValues.amount1In,
      bnbAmountIn: event.returnValues.amount0Out,
      wqtAmountIn: event.returnValues.amount1Out,
      account: event.returnValues.to,
    }
  }

  private async processEvents(events: any): Promise<SwapEvent[]> {
    return Promise.all(events.map((event) => { return this.processEvent(event) }));
  }

  public async storeData(events:any): Promise<void> {
    const transactionsInfo = await this.processEvents(events);
    await SwapEventWqtWbnb.bulkCreate(transactionsInfo);
  }

  public async processBlockInfo(blockNumber: number): Promise<void> {
    const swapInfo = await this.contract.getPastEvents('Swap', {fromBlock: blockNumber, toBlock: 'latest'});
    if (swapInfo.length !== 0) {
      await this.storeData(swapInfo);
    }
  }

  public async subscribeOnEvent(): Promise<void> {
    this.web3Helper.web3.eth.subscribe('newBlockHeaders', async (error, block) => {
        if (error) {
          console.log(error, 'ERROR SUBSCRIBE');
        } else {
          console.log(block.number)
          await this.processBlockInfo(block.number);
        }
      }
    );
  }
}
