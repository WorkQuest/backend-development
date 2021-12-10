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

  async coinPriceInUSD(timestamp: number, coin: Coins): Promise<number> {
    try {
      const result = await this.api.get(`coins/${coin}/market_chart/range?vs_currency=usd&from=${timestamp - 1800}&to=${timestamp + 1800}`, {
        timeout: 10000
      });
      return result.data.prices[0][1];
    } catch (error) {
      console.log(error);
    }
  }
}
