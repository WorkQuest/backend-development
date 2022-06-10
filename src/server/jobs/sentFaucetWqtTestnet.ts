import { addJob } from '../utils/scheduler';
import { Transaction, TransactionStatus, FaucetWqtWusd } from '@workquest/database-models/lib/models';
import { error } from '../utils';
import { Errors } from '../utils/errors';
import { Networks } from '@workquest/contract-data-pools';
import Web3 from 'web3';
import config from '../config/config';

export interface sentFaucetWqtPayload {
  address: string;
  amount: string;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sentFaucetWqtTestnetJob(payload: sentFaucetWqtPayload) {
  return addJob('sentFaucetWqtTestnet', payload);
}

export default async function(payload: sentFaucetWqtPayload) {
  try {
    const transmissionData = await FaucetWqtWusd.findOne({
      where: { address: payload.address, symbol: 'WQT' }
    });

    if (transmissionData.status !== TransactionStatus.Pending) {
      return error(Errors.Forbidden, 'Job to send WQT can`t send transaction, because status not pending ', {});
    }

    await transmissionData.update({ status: TransactionStatus.InProcess });

    const web3 = new Web3(new Web3.providers.HttpProvider(config.faucet.workQuestDevNetwork.linkRpcProvider));
    const account = web3.eth.accounts.privateKeyToAccount(config.faucet.privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const gasLimit = await web3.eth.estimateGas({
      from: config.faucet.address,
      to: payload.address,
      value: web3.utils.toWei(payload.amount.toString())
    });
    const gasPrice = parseInt(await web3.eth.getGasPrice());

    const transactionConfig = {
      gasPrice,
      gas: gasLimit,
      from: config.faucet.address,
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

        if (!receipt.status) {
          transmissionData.status = TransactionStatus.TransactionError;
        }

        await transmissionData.update({
          status: TransactionStatus.Success,
          transactionHashFaucetSentToken: transaction.hash
        });

        await transaction.save();
      })
      .catch(async error => {
        await transmissionData.update({
          error: error.toString(),
          status: TransactionStatus.BroadcastError
        });
      });
    await sleep(5000);
  } catch (err) {
    console.log(err);
    await FaucetWqtWusd.update({
      error: err.toString(),
      status: TransactionStatus.UnknownError
    }, {
      where: { address: payload.address, symbol: 'WQT' }
    });
    await sleep(5000);
  }
}
