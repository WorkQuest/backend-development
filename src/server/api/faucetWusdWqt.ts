import { error, output } from '../utils';
import { BlockchainNetworks, FaucetAmount, FaucetWusdWqt, User } from '@workquest/database-models/lib/models';
import { ethers } from 'ethers';
import config from '../config/config';
import Web3 from 'web3';
import { Errors } from '../utils/errors';
import path from 'path';
import fs from 'fs';

const abiFilePath = path.join(__dirname, '../../server/abi/WqtContract.json');
const abi: any[] = JSON.parse(fs.readFileSync(abiFilePath).toString()).abi;

export async function sentFaucetWusd(r) {
  const user: User = r.auth.credentials;

  const userWallet = await User.scope('shortWithWallet').findByPk(user.id);//r.auth.credentials.id)

  const transferWallet = await FaucetWusdWqt.findOne({
    where: {
      address: userWallet.wallet.address,
      symbol: 'WUSD'
    }
  });

  if (transferWallet) {
    return error(Errors.Forbidden, 'Test coin WUSD have already been sent before', {});
  }
  const faucetWalletInfo = await ethers.utils.HDNode.fromMnemonic(config.faucet.mnemonic).derivePath(config.faucet.derivePath);

  const web3 = new Web3(new Web3.providers.HttpProvider(config.faucet.rpcProvider));

  const account = web3.eth.accounts.privateKeyToAccount(faucetWalletInfo.privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const gasPrice = await web3.eth.getGasPrice().then(value => {
    return value;
  });

  const gasEstimate = await web3.eth.estimateGas({
    from: config.faucet.faucetWallet,
    to: userWallet.wallet.address,
    value: FaucetAmount.WUSD
  }).then(value => {
    return value;
  });

  const response = await web3.eth.sendTransaction({
    from: config.faucet.faucetWallet,
    gasPrice: gasPrice,
    gas: gasEstimate,
    to: userWallet.wallet.address,
    value: FaucetAmount.WUSD
  }).then(response => {
    return response;
  });

  await FaucetWusdWqt.create({
    userId: user.id,
    address: userWallet.wallet.address,
    amount: FaucetAmount.WUSD,
    symbol: 'WUSD',
    blockNumber: response.blockNumber,
    transactionHash: response.transactionHash,
    network: BlockchainNetworks.workQuestDevNetwork //TODO fix newtwork
  });

  return output({
    txHash: response.transactionHash,
    status: response.status
  });
}

export async function sentFaucetWqt(r) {
  const user = { id: 'd7cbc315-dc56-488f-a8a7-dafa75c7a9a4' };//r.auth.credentials;

  const userWallet = await User.scope('shortWithWallet').findByPk(user.id);//r.auth.credentials.id)

  const transferWallet = await FaucetWusdWqt.findOne({
    where: {
      address: userWallet.wallet.address,
      symbol: 'WQT'
    }
  });

  if (transferWallet) {
    return error(Errors.Forbidden, 'Test coin WQT have already been sent before', {});
  }
  const faucetWalletInfo = await ethers.utils.HDNode.fromMnemonic(config.faucet.mnemonic).derivePath(config.faucet.derivePath);

  const web3 = new Web3(new Web3.providers.HttpProvider(config.faucet.rpcProvider));

  const contract = new web3.eth.Contract(abi, config.faucet.token, { from: config.faucet.faucetWallet });

  const account = web3.eth.accounts.privateKeyToAccount(faucetWalletInfo.privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const gasPrice = await web3.eth.getGasPrice().then(value => {
    return value;
  });

  const sendTrans = await web3.eth.sendTransaction({
    from: config.faucet.faucetWallet,
    gasPrice: gasPrice,
    gas: 216450,
    to: config.faucet.token,
    value: '0x0',
    data: contract.methods.transfer(userWallet.wallet.address, FaucetAmount.WQT).encodeABI()
  }).then(response => {
    return response;
  });

  await FaucetWusdWqt.create({
    userId: user.id,
    address: userWallet.wallet.address,
    amount: FaucetAmount.WQT,
    symbol: 'WQT',
    blockNumber: sendTrans.blockNumber,
    transactionHash: sendTrans.transactionHash,
    network: BlockchainNetworks.workQuestDevNetwork //TODO fix newtwork
  });

  return output({
    txHash: sendTrans.transactionHash,
    status: sendTrans.status
  });
}
