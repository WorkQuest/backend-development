import axios from "axios";
import { Coin, TokenPriceProvider } from "./types";

enum CoinGeckoCoin {
  WQT = "work-quest",
  BNB = "binancecoin",
}

export class CoinGeckoProvider implements TokenPriceProvider {
  private readonly api;

  private limitCheckStartTimeInMilliseconds: number;

  private numberOfRequests: number;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3/'
    });
  }

  private checkLimit() {
    // TODO
  }

  private updateLimit() {
    // TODO
  }

  public static getNameCoin(coin: Coin): string {
    if (coin === Coin.BNB) {
      return CoinGeckoCoin.BNB;
    }
    if (coin === Coin.WQT) {
      return CoinGeckoCoin.WQT;
    }
  }

  public async coinPriceInUSD(timestamp: number | string, coin: Coin): Promise<number> {
    this.checkLimit();

    const coinName = CoinGeckoProvider.getNameCoin(coin);

    const result = await this.api.get(`coins/${coinName}/market_chart/range?vs_currency=usd&from=${parseInt(timestamp as string) - 1800 - 60}&to=${parseInt(timestamp as string) + 1800 + 60}`, {
      timeout: 10000
    });

    this.updateLimit();

    if (result.data.prices.length === 0) {
      return null
    } else {
      return result.data.prices[0][1];
    }

  }
}
