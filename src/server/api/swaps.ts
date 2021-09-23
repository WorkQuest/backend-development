import { RequestOrig } from "hapi";
import BigNumber from "bignumber.js";
import { SwapData } from "@workquest/database-models/lib/models";
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
  const { count, rows } = await SwapData.findAndCountAll({
    limit,
    offset,
    order: [
      ["createdAt", "DESC"]
    ],
    where:
      {
        recipient: recipient.toLowerCase(),
        active: true
      }
  });
  for (const e of rows) {
    let obj = {
      blockNumber: e.blockNumber,
      transactionHash: e.transactionHash,
      nonce: e.nonce,
      active: e.active,
      timestamp: e.timestamp,
      initiator: e.initiator,
      recipient: e.recipient,
      amount: e.amount.toString(),
      chainTo: e.chainTo,
      chainFrom: e.chainFrom,
      token: e.token,
      createdAt: e.createdAt,
      signData: []
    };
    const signArr = [];
    signArr.push(e.nonce);
    signArr.push(new BigNumber(e.amount));
    signArr.push(e.recipient);
    signArr.push(e.chainFrom);
    signArr.push(e.chainTo);
    signArr.push(e.token);
    obj.signData.push(e.nonce.toString());
    obj.signData.push(e.chainFrom.toString());
    obj.signData.push(toFixed(e.amount).toString());
    obj.signData.push(e.recipient.toString());
    const web3 = new Web3(wsProviders.bsc);
    let res = await web3.eth.accounts.sign(web3.utils.soliditySha3(...signArr), metaMaskKey);
    obj.signData.push(res.v.toString());
    obj.signData.push(res.r.toString());
    obj.signData.push(res.s.toString());
    obj.signData.push(e.token.toString());
    swaps.push(obj);
  }

  return output({ count, swaps });
}

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + (new Array(e)).join("0") + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += (new Array(e + 1)).join("0");
    }
  }
  return x;
}
