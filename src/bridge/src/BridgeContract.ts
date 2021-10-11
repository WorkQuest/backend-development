import Web3 from "web3";
import { Contract, EventData, PastEventOptions } from "web3-eth-contract";
import { BridgeProvider } from "./BridgeProvider";

type onEventCallBack = {
  (eventData: EventData): void;
}

// TODO описать eventData: any
export class BridgeContract {
  private readonly _address: string;
  private readonly _contract: Contract;
  private readonly _provider: BridgeProvider;
  private readonly _preParsingSteps = 6000;

  private readonly _onEventCallBacks: onEventCallBack[] = [];

  constructor(provider: BridgeProvider, address: string, abiItems: any[]) {
    this._contract = provider.makeContract(abiItems, address);
    this._address = address;
    this._provider = provider;

    this._eventListenerInit();
  }

  private async _onEventData(data: any) {
    const eventData = {
      timestamp: data.returnValues.timestamp,
      sender: data.returnValues.sender,
      recipient: data.returnValues.recipient,
      amount: data.returnValues.amount,
      chainFrom: data.returnValues.chainFrom,
      chainTo: data.returnValues.chainTo,
      nonce: data.returnValues.nonce,
      symbol: data.returnValues.symbol,
      event: data.event,
      messageHash: null,
    };

    const signedEventData = await this._singEventData(eventData);
    // console.log(signedEventData, 'signedEventData');

    this._provider.lastTrackedBlock = data.blockNumber;
    this._onEventCallBacks.forEach(callBack => callBack(signedEventData));
  }

  private _eventListenerInit() {
    this._contract.events.allEvents({ fromBlock: this._provider.lastTrackedBlock })
      .on('error', (err) => { console.error(err) })
      .on('data', (data) => this._onEventData(data));
  }

  private async _singEventData(eventData: any): Promise<any> {
    const fields = [
      eventData.nonce,
      eventData.amount,
      eventData.recipient,
      eventData.sender,
      eventData.chainFrom,
      eventData.chainTo,
      eventData.symbol,
    ];

    eventData.messageHash = (await this._provider.sing(fields)).message;

    return eventData;
  }

  public signCallbackOnEvent(callBack: onEventCallBack) {
    this._onEventCallBacks.push(callBack);
  }

  public async getPastEvents(event: string, options: PastEventOptions): Promise<any[]> {
    return this._contract.getPastEvents(event, options);
  }

  public async* preParsingEvents() {
    const lastBlockNumber = await this._provider.getBlockNumber();

    let fromBlock = this._provider.lastTrackedBlock;
    let toBlock = fromBlock + this._preParsingSteps;

    while(true) {
      yield this.getPastEvents('allEvents', { fromBlock, toBlock });

      fromBlock += this._preParsingSteps;
      toBlock = fromBlock + this._preParsingSteps;

      if (toBlock >= lastBlockNumber) {
        yield this.getPastEvents('allEvents', { fromBlock, toBlock }); break;
      }
    }
  }
}
