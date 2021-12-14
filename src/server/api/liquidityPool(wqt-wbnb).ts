import * as fs from 'fs';
import * as path from 'path';
import config from "../config/config";
import BigNumber from 'bignumber.js';
import { output } from "../utils";
import { ChainId, Token, TokenAmount, Pair } from "@pancakeswap/sdk";
import { PancakeSwapApi } from "../controllers/controller.pancakeSwap";
import { CoingeckoApi } from "../controllers/controller.coingecko";
import { DailyLiquidity } from "@workquest/database-models/lib/models";

const Web3 = require('web3');

const WQT = new Token(
  ChainId.MAINNET,
  config.token.WQT.bscNetwork.address,
  config.token.WQT.bscNetwork.decimals,
  config.token.WQT.bscNetwork.symbol,
  config.token.WQT.bscNetwork.name,
);

const WBNB = new Token(
  ChainId.MAINNET,
  config.token.WBNB.address,
  config.token.WBNB.decimals,
  config.token.WBNB.symbol,
  config.token.WBNB.name,
);

const pair = new Pair(
  new TokenAmount(WQT, config.token.WQT.bscNetwork.amountMax),
  new TokenAmount(WBNB, config.token.WBNB.amountMax)
);

const pancakeSwapApi = new PancakeSwapApi(pair);
const coingeckoApi = new CoingeckoApi();

const liquidityMiningProvider = new Web3( new Web3.providers.WebsocketProvider(config.contracts.liquidityMining.webSocketProvider, {
  clientConfig: {
    keepalive: true,
    keepaliveInterval: 60000 // ms
  },
  reconnect: {
    auto: true,
    delay: 1000, // ms
    onTimeout: false
  }
}));

const liquidityMiningAbiPath = path.join(__dirname, '../abi/WQLiquidityMining.json');
const liquidityMiningAbi: [] = JSON.parse(fs.readFileSync(liquidityMiningAbiPath).toString()).abi;
const liquidityMiningContract = new liquidityMiningProvider.eth.Contract(liquidityMiningAbi, config.contracts.liquidityMining.contract);

export async function getSwaps(r) {
  const swaps = await pancakeSwapApi.getSwaps({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output(swaps);
}

export async function getMints(r) {
  const mints = await pancakeSwapApi.getMints({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output(mints);
}

export async function getBurns(r) {
  const burns = await pancakeSwapApi.getBurns({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output(burns);
}

export async function getTokenDayData(r) {
  const {count, rows} = await DailyLiquidity.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: ["date", "DESC"],
  });

  return output({count, infoPer10Days: rows});
}

export async function getDistribution(r) {
  const stakingInfoEvent = await liquidityMiningContract.methods.getStakingInfo().call();
  const totalStaked = new BigNumber(stakingInfoEvent.totalStaked).shiftedBy(-18).toNumber();
  const rewardTotal = new BigNumber(stakingInfoEvent.rewardTotal).shiftedBy(-18).toNumber();

  const UsdPrice = await coingeckoApi.getUsdPrice();

  const tokenDayData = await pancakeSwapApi.getTokenDayData({limit: 1, offset: 0});

  const reserveUSD = tokenDayData[0].reserveUSD;
  const totalSupply = tokenDayData[0].totalSupply;

  return output({
    rewardTotal: rewardTotal.toString(),
    priceUSD: UsdPrice.toString(),
    totalStaked: totalStaked.toString(),
    reserveUSD: reserveUSD,
    totalSupply: totalSupply });
}
