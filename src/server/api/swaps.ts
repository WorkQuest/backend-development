import { RequestOrig } from "hapi";
import { BridgeSwapTokenEvent } from "@workquest/database-models/lib/models";
import { metaMaskKey, wsProviders } from "../config/constant";
import { output } from "../utils";

const Web3 = require("web3");

export interface QuerySwapsTakeInterface {
  recipient: string,
}
export interface QueryPaginationInterface {
    limit: number,
    offset: number,
}

export async function getSwapsTake({ query }: RequestOrig): Promise<object> {
  const { recipient } = <QuerySwapsTakeInterface>query;
  const { limit, offset } = <QueryPaginationInterface>query;
  const swaps = [];
  const { count, rows } = await BridgeSwapTokenEvent.findAndCountAll({
    limit, offset,
    order: [
      ["createdAt", "DESC"]
    ],
    where: { recipient: recipient.toLowerCase() }
  });
  for (const e of rows) {
    let obj = {
      blockNumber: e.blockNumber,
      transactionHash: e.transactionHash,
      nonce: e.nonce,
      timestamp: e.timestamp,
      initiator: e.initiator,
      recipient: e.recipient,
      amount: e.amount,
      chainTo: e.chainTo,
      chainFrom: e.chainFrom,
      symbol: e.symbol,
      createdAt: e.createdAt,
      signData: []
    };
    const signArr = [];
    signArr.push(e.nonce);
    signArr.push(e.amount);
    signArr.push(e.recipient);
    signArr.push(e.chainFrom);
    signArr.push(e.chainTo);
    signArr.push(e.symbol);
    obj.signData.push(e.nonce.toString());
    obj.signData.push(e.chainFrom.toString());
    obj.signData.push(e.amount);
    obj.signData.push(e.recipient.toString());
    const web3 = new Web3(wsProviders.bsc);
    let res = await web3.eth.accounts.sign(web3.utils.soliditySha3(...signArr), metaMaskKey);
    obj.signData.push(res.v.toString());
    obj.signData.push(res.r.toString());
    obj.signData.push(res.s.toString());
    obj.signData.push(e.symbol);
    swaps.push(obj);
  }

  return output({ count, swaps });
}
