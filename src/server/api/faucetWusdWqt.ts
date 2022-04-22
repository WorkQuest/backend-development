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

  const userWallet = await User.scope('shortWithWallet').findByPk(user.id);

  const transferWallet = await FaucetWusdWqt.findOne({
    where: {
      address: userWallet.wallet.address,
      symbol: 'WUSD'
    }
  });

  if (transferWallet) {
    return error(Errors.Forbidden, 'Test coin WUSD have already been sent before', {});
  }
  const faucetWalletInfo = await ethers.utils.HDNode.fromMnemonic(config.faucet.mnemonic).derivePath('m/44\'/60\'/0\'/0/0');

  const web3 = new Web3(new Web3.providers.HttpProvider('https://dev-node-ams3.workquest.co/'));

  const account = web3.eth.accounts.privateKeyToAccount(faucetWalletInfo.privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const gasPrice = await web3.eth.getGasPrice().then(value => {
    return value;
  });

  const gasEstimate = await web3.eth.estimateGas({
    from: '0xaec41239f499458362c9317b3b82dd587c6a74a6',
    to: userWallet.wallet.address,
    value: FaucetAmount.WUSD
  }).then(value => {
    return value;
  });

  const response = await web3.eth.sendTransaction({
    from: '0xaec41239f499458362c9317b3b82dd587c6a74a6',
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
  const user: User = r.auth.credentials;

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
  const faucetWalletInfo = await ethers.utils.HDNode.fromMnemonic(config.faucet.mnemonic).derivePath('m/44\'/60\'/0\'/0/0');

  const web3 = new Web3(new Web3.providers.HttpProvider('https://dev-node-ams3.workquest.co/'));

  const contract = new web3.eth.Contract(abi, '0x917dc1a9E858deB0A5bDCb44C7601F655F728DfE', { from: '0xaec41239f499458362c9317b3b82dd587c6a74a6' });

  const account = web3.eth.accounts.privateKeyToAccount(faucetWalletInfo.privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  const gasPrice = await web3.eth.getGasPrice().then(value => {
    return value;
  });

  const sendTrans = await web3.eth.sendTransaction({
    from: '0xaec41239f499458362c9317b3b82dd587c6a74a6',
    gasPrice: gasPrice,
    gas: 216450,
    to: '0x917dc1a9E858deB0A5bDCb44C7601F655F728DfE',
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
