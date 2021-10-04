import Web3 from "web3";
import { WebsocketProvider, HttpProvider, Sign } from "web3-core";
import config from "../../server/config/config";

export class BridgeProvider {
  private readonly _web3: Web3;
  private readonly _network: 'eth' | 'bnb';

  private _lastTrackedBlock: number;

  get network() {
    return this._network;
  }

  get lastTrackedBlock() {
    return this._lastTrackedBlock;
  }

  set lastTrackedBlock(value) {
    this._lastTrackedBlock = value;
  }

  constructor(web3: Web3, network: 'eth' | 'bnb', fromBlock: number) {
    this._lastTrackedBlock = fromBlock;
    this._network = network;
    this._web3 = web3;
  }

  public async getBlockNumber(): Promise<number> {
    return this._web3[this._network].getBlockNumber();
  }

  public async sing(fields: any[]): Promise<Sign> {
    return Web3[this.network].accounts.sign(Web3.utils.soliditySha3(...fields), config.bridge.privateKey);
  }

  static buildBridgeProvider(provider: WebsocketProvider | HttpProvider, network: 'eth' | 'bnb', fromBlock: number) {
    const web3 = new Web3(provider);

    return new BridgeProvider(web3, network, fromBlock);
  }
}
