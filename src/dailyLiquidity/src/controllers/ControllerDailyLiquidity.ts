import { Contract, EventData } from "web3-eth-contract";
import { CoinGeckoProvider, Web3ProviderHelper } from "../api/dailyLiquidity";

export class ControllerDailyLiquidity {
  private readonly coinGeckoProvider: CoinGeckoProvider

  constructor(
    private readonly web3ProviderHelper: Web3ProviderHelper,
    private readonly dailyLiquidityContract: Contract,
  ) { }

  private async parseLastEvents(event: string, rangeHeight: { from: number, to: number }): Promise<EventData[]> {
    const result: EventData[];
    const stepRange = 5000;

    let fromBlock =
    let toBlock =

    while () {
      const eventData = await this.dailyLiquidityContract.getPastEvents(event, {
        fromBlock, toBlock,
      });

      result.push(...eventData);
    }

    return result;
  }

  public async firstStart() {
    /** Now - 10 day - 1 day (current) */
    // TODO Бери from/to тут с помощью estimateBlockHeightByTimestamp
    const last10Days =

    const timestamp = Date.now()

    // TODO берешь все events parseLastEvents
  }
}
