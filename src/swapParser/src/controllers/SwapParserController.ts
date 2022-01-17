import { Web3Helper } from "../providers/Web3Helper";
import { SwapParser } from "@workquest/database-models/lib/models";
import { SyncEvent } from "../../../dailyLiquidity/src/controllers/ControllerDailyLiquidity";

export class SwapParserController {
  constructor (
    private readonly web3Helper: Web3Helper,
    private readonly contract: any,
  ) {
    this.web3Helper = web3Helper
    this.contract = contract
  }

  private async processEvent(event: any): Promise<any> {
    const blockInfo = await this.web3Helper.web3.eth.getBlock(event.blockNumber);

    return {
      date: blockInfo.timestamp,
      blockNumber: event.blockNumber,
      bnbPool: event.returnValues.reserve0,
      wqtPool: event.returnValues.reserve1,
    }
  }

  private async processEvents(events: any): Promise<any> {
    return Promise.all(events.map((event) => { return this.processEvent(event) }));
  }

  public async storeData(events:any) {
    const transactionsInfo = [];

    transactionsInfo.push(await this.processEvents(events));

    await SwapParser.bulkCreate(transactionsInfo);
  }

  public async processBlockInfo(blockNumber: number) {
    const swapInfo = await this.contract.getPastEvents('Swap', {fromBlock: blockNumber, toBlock: 'latest'});
    await this.storeData(swapInfo);
  }

  public async subscribeOnEvent() {
    this.web3Helper.web3.eth.subscribe('newBlockHeaders', async (error, block) => {
        if (error) {
          console.log(error, 'ERROR SUBSCRIBE');
        } else {
          await this.processBlockInfo(block.number);
        }
      }
    );
  }
}
