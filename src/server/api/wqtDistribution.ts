import * as path from 'path';
import * as fs from 'fs';

const Web3 = require('web3');

const PROVIDER_LINK = 'wss://speedy-nodes-nyc.moralis.io/c9991b05b32effdda8b167e6/bsc/mainnet/ws'
const CONTRACT_ADDRESS_TRADE = '0x7F31d9c6Cf99DDB89E2a068fE7B96d230b9D19d1'

const filePath = path.join(__dirname,'/abi/WQLiquidityMining.json');
const abi: any[] = JSON.parse(fs.readFileSync(filePath).toString()).abi;

export async function wqtDistribution() {
  console.log(abi);
  const provider = new Web3.providers.WebsocketProvider(PROVIDER_LINK);
  const web3 = new Web3(provider);
  const tradeContract = new web3.eth.Contract('', CONTRACT_ADDRESS_TRADE);
  await tradeContract.methods.getStakingInfo().call().then(function (events, err) {
    console.log(events)
  })
  console.log(tradeContract)
}
