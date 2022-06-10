import Web3 from 'web3';
import config from '../config/config';
import { addJob } from '../utils/scheduler';
import {
  Networks,
  Store,
  WorkQuestNetworkContracts
} from '@workquest/contract-data-pools';
import {
  Transaction,
  FaucetSymbol,
  FaucetWqtWusd,
  TransactionStatus
} from '@workquest/database-models/lib/models';

export interface SendFaucetWusdPayload {
  address: string;
  amount: string;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendFaucetWusdTestnetJob(payload: SendFaucetWusdPayload) {
  return addJob('sendFaucetWusdTestnet', payload);
}

export default async function(payload: SendFaucetWusdPayload) {
  try {
    const transmissionData = await FaucetWqtWusd.findOne({
      where: { address: payload.address, symbol: FaucetSymbol.WUSD }
    });

    if (transmissionData.status !== TransactionStatus.Pending) {
      return;
    }

    await transmissionData.update({ status: TransactionStatus.InProcess });

    const contractWusdData = Store[Networks.WorkQuest][WorkQuestNetworkContracts.WUSD];

    const web3 = new Web3(new Web3.providers.HttpProvider(config.faucet.workQuestDevNetwork.linkRpcProvider));
    const account = web3.eth.accounts.privateKeyToAccount(config.faucet.privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const contractWusd = new web3.eth.Contract(
      contractWusdData.getAbi(),
      contractWusdData.address,
      { from: config.faucet.address }
    );

    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = await contractWusd.methods['transfer'].apply(null, [
      payload.address,
      web3.utils.toWei(payload.amount.toString())
    ]).estimateGas({ from: config.faucet.address });

    const transactionConfig = {
      gasPrice,
      gas: gasLimit,
      from: config.faucet.address,
      to: contractWusdData.address,
      data: contractWusd.methods.transfer(payload.address, web3.utils.toWei(payload.amount.toString())).encodeABI()
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
      });
  } catch (err) {
    console.log(err);

    await FaucetWqtWusd.update({
      error: err.toString(),
      status: TransactionStatus.UnknownError
    }, {
      where: { address: payload.address, symbol: FaucetSymbol.WUSD }
    });
  }

  await sleep(5000);
}
