import { BridgeContract } from "./BridgeContract";
import { EventData } from "web3-eth-contract";

export enum TrackedEvents {
  swapInitialized = "SwapInitialized",
  swapRedeemed = "SwapRedeemed",
}

export class BridgeListener {
  private readonly _contract: BridgeContract;

  constructor(contract: BridgeContract) {
    this._contract = contract;
  }

  private _parseSwapInitializedEvent(data: EventData) {

  }

  private _parseSwapRedeemedEvent(data: EventData) {

  }

  private _onEvent(data: EventData): void {
    // TODO: update ParserInfo

    if (data.event === TrackedEvents.swapInitialized) {
      this._parseSwapInitializedEvent(data);
    } else if (data.event === TrackedEvents.swapRedeemed) {
      this._parseSwapRedeemedEvent(data);
    }
  }

  async parseEvents(fromBlock: number) {

  }

  startListen() {
    this._contract.signCallbackOnEvent(this._onEvent);
  }
}
