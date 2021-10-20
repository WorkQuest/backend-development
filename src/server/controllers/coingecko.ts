import axios, {AxiosInstance, AxiosResponse} from "axios";
import {error} from "../utils";
import {Errors} from "../utils/errors";

export class CoingeckoApi {
  protected readonly _apiCoingecko: AxiosInstance;

  constructor() {
    this._apiCoingecko = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3/coins/work-quest'
    });
  }

  public async getUsdPrice(): Promise<any | never> {
    let result: AxiosResponse;

    try {
      result = await this._apiCoingecko.get('');
    } catch (responseError) {
      if (responseError.response) {
        throw error(Errors.LiquidityError, responseError.response.statusText, responseError.response.data);
      }

      throw error(Errors.LiquidityError, responseError, {});
    }

    return result.data.market_data.current_price.usd;
  }
}
