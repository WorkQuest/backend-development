import Web3 from "web3";
import { Contract, EventData, PastEventOptions } from "web3-eth-contract";
import { BridgeProvider } from "./BridgeProvider";

type onEventCallBack = {
  (eventData: EventData): void;
}

export class BridgeContract {
  private readonly _abi: string;
  private readonly _address: string;
  private readonly _contract: Contract;
  private readonly _provider: BridgeProvider;

  private readonly _onEventCallBacks: onEventCallBack[];

  constructor(provider: BridgeProvider, address: string, abi: string) {
    this._abi = abi;
    this._address = address;
    this._provider = provider
    this._contract = new Web3[provider.network].Contract(abi, address);

    this._eventListenerInit();
  }

  private _eventListenerInit() {
    this._contract.events.allEvents({ fromBlock: this._provider.lastTrackedBlock })
      .on('error', (err) => { /** TODO */ })
      .on('data', (data: EventData) => {
        this._provider.lastTrackedBlock = data.blockNumber;

        this._onEventCallBacks.forEach(callBack => callBack(data));
      });
  }

  public signCallbackOnEvent(callBack: onEventCallBack) {
    this._onEventCallBacks.push(callBack);
  }

  public async getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]> {
    return this._contract.getPastEvents(event, options);
  }
}
