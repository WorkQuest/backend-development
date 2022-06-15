import Web3 from 'web3';
import config from '../config/config';
import { addJob } from '../utils/scheduler';
import { Networks } from '@workquest/contract-data-pools';
import {
  Transaction,
  FaucetSymbol,
  FaucetWqtWusd,
  TransactionStatus
} from '@workquest/database-models/lib/models';

export interface SendFaucetWqtPayload {
  address: string;
  amount: string;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendFaucetWqtJob(payload: SendFaucetWqtPayload) {
  return addJob('sendFaucetWqt', payload);
}

export default async function(payload: SendFaucetWqtPayload) {
  try {
    const transmissionData = await FaucetWqtWusd.findOne({
      where: { address: payload.address, symbol: FaucetSymbol.WQT }
    });

    if (transmissionData.status !== TransactionStatus.Pending) {
      return;
    }

    await transmissionData.update({ status: TransactionStatus.InProcess });

    const web3 = new Web3(new Web3.providers.HttpProvider(config.faucet.workQuestDevNetwork.linkRpcProvider));
    const account = web3.eth.accounts.privateKeyToAccount(config.faucet.wqt.privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const gasLimit = await web3.eth.estimateGas({
      from: config.faucet.wqt.address,
      to: payload.address,
      value: web3.utils.toWei(payload.amount.toString())
    });
    const gasPrice = await web3.eth.getGasPrice();

    const transactionConfig = {
      gasPrice,
      gas: gasLimit,
      from: config.faucet.wqt.address,
      to: payload.address,
      value: web3.utils.toWei(payload.amount.toString())
    };

    web3.eth.sendTransaction(transactionConfig)
      .then(async receipt => {
        const transaction = await Transaction.create({
          hash: receipt.transactionHash.toLowerCase(),
          to: receipt.to.toLowerCase(),
          from: receipt.from.toLowerCase(),
          status: receipt.status ? 0 : 1,
          gasUsed: receipt.gasUsed,
          amount: web3.utils.toWei(payload.amount.toString()),
          blockNumber: receipt.blockNumber,
          network: Networks.WorkQuest
        });

        await transmissionData.update({
          status: receipt.status
            ? TransactionStatus.Success
            : TransactionStatus.TransactionError,
          transactionHashFaucetSentToken: transaction.hash
        });
      })
      .catch(async error => {
        await transmissionData.update({
          error: error.toString(),
          status: TransactionStatus.BroadcastError
        });

        return false;
      });
  } catch (err) {
    console.log(err);

    await FaucetWqtWusd.update({
      error: err.toString(),
      status: TransactionStatus.UnknownError
    }, {
      where: { address: payload.address, symbol: FaucetSymbol.WQT }
    });

    return false;
  }

  await sleep(5000);
}
