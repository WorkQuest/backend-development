import axios from "axios";

export enum Coins {
  WQT = "work-quest",
  BNB = "binancecoin",
}

export class CoinGeckoProvider {
  private readonly api;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3/'
    });
  }

  async coinPriceInUSD(timestamp: number | string, coin: Coins): Promise<number> {
    const result = await this.api.get(`coins/${coin}/market_chart/range?vs_currency=usd&from=${parseInt(timestamp as string) - 1800}&to=${parseInt(timestamp as string) + 1800}`, {
      timeout: 10000
    });

    return parseInt(result.data.prices[0][1]);
  }
}
