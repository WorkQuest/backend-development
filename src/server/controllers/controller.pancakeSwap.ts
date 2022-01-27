import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Pair } from '@pancakeswap/sdk';
import { error } from '../utils';
import { Errors } from '../utils/errors';

type TokenTransaction = {
  id: string;
  timestamp: string;
};

type BaseTokenInfo = {
  amount0: string;
  amount1: string;
  amountUSD: string;
  liquidity: string;
  to: string;
  transaction: TokenTransaction;
};

export type Swap = {
  amount0In: string;
  amount0Out: string;
  amount1In: string;
  amount1Out: string;
  amountUSD: string;
  to: string;
  transaction: TokenTransaction;
};

export type TokenDayData = {
  dailyTxns: string;
  dailyVolumeToken0: string;
  dailyVolumeToken1: string;
  dailyVolumeUSD: string;
  date: number;
  reserve0: string;
  reserve1: string;
  reserveUSD: string;
  totalSupply: string;
};

export type Burn = BaseTokenInfo;
export type Mint = BaseTokenInfo;

export class PancakeSwapApi {
  protected readonly _apiPancakeSwap: AxiosInstance;

  protected readonly _pair: Pair;

  constructor(pair: Pair) {
    this._pair = pair;
    this._apiPancakeSwap = axios.create({
      baseURL: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2',
    });
  }

  public async getSwaps(options: { limit: number; offset: number }): Promise<Swap[] | never> {
    let result: AxiosResponse;

    try {
      result = await this._apiPancakeSwap.post('', {
        query: `{
        swaps(first:${options.limit}, skip:${options.offset}, orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${this._pair.liquidityToken.address.toLowerCase()}" }) 
        { transaction { id timestamp } 
        amount0In amount0Out amount1In amount1Out amountUSD to } }`,
      });
    } catch (responseError) {
      if (responseError.response) {
        throw error(Errors.LiquidityError, responseError.response.statusText, responseError.response.data);
      }

      throw error(Errors.LiquidityError, responseError, {});
    }

    if (result.data.errors) {
      throw error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return result.data.data.swaps;
  }

  public async getMints(options: { limit: number; offset: number }): Promise<Mint[] | never> {
    let result: AxiosResponse;

    try {
      result = await this._apiPancakeSwap.post('', {
        query: `{ 
        mints(first:${options.limit}, skip:${options.offset}, orderBy: timestamp, orderDirection: desc, 
        where: { pair: "${this._pair.liquidityToken.address.toLowerCase()}" }) {
        transaction { id timestamp } 
        to liquidity amount0 amount1 amountUSD } }`,
      });
    } catch (responseError) {
      if (responseError.response) {
        throw error(Errors.LiquidityError, responseError.response.statusText, responseError.response.data);
      }

      throw error(Errors.LiquidityError, responseError, {});
    }

    if (result.data.errors) {
      throw error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return result.data.data.mints;
  }

  public async getBurns(options: { limit: number; offset: number }): Promise<Burn[] | never> {
    let result: AxiosResponse;

    try {
      result = await this._apiPancakeSwap.post('', {
        query: `{
        burns(first:${options.limit}, skip:${options.offset}, orderBy: timestamp, orderDirection: desc,
        where: { pair: "${this._pair.liquidityToken.address.toLowerCase()}" })
        { transaction { id timestamp }
        to liquidity amount0 amount1 amountUSD } }`,
      });
    } catch (responseError) {
      if (responseError.response) {
        throw error(Errors.LiquidityError, responseError.response.statusText, responseError.response.data);
      }

      throw error(Errors.LiquidityError, responseError, {});
    }

    if (result.data.errors) {
      throw error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return result.data.data.burns;
  }

  public async getTokenDayData(options: { limit: number; offset: number }): Promise<TokenDayData | never> {
    let result: AxiosResponse;

    try {
      result = await this._apiPancakeSwap.post('', {
        query: `{ 
        pairDayDatas (first: ${options.limit}, skip: ${options.offset},
        orderBy:date, orderDirection: desc,
        where: {pairAddress: "${this._pair.liquidityToken.address.toLowerCase()}"})
        { date reserve0 reserve1 totalSupply reserveUSD dailyVolumeToken0
          dailyVolumeToken1 dailyVolumeUSD dailyTxns 
        }}`,
      });
    } catch (responseError) {
      if (responseError.response) {
        throw error(Errors.LiquidityError, responseError.response.statusText, responseError.response.data);
      }

      throw error(Errors.LiquidityError, responseError, {});
    }

    if (result.data.errors) {
      throw error(Errors.LiquidityError, 'Query error', result.data.errors);
    }

    return result.data.data.pairDayDatas;
  }
}
