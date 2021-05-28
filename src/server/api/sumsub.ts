import axios from "axios";
import * as crypto from "crypto";
import serverConfig from '../config/config';
import { error, output } from '../utils';
import * as FormData from "form-data";
import { Errors } from '../utils/errors';

const api = axios.create({
  baseURL: serverConfig.sumsub.baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-App-Token': serverConfig.sumsub.appToken,
  }
});

api.interceptors.request.use(createSignature, function (error) {
  return Promise.reject(error);
})

function createSignature(config) {
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', serverConfig.sumsub.secretKey);
  signature.update(ts + config.method.toUpperCase() + config.url);

  if (config.data instanceof FormData) {
    signature.update (config.data.getBuffer());
  } else if (config.data) {
    signature.update (config.data);
  }

  config.headers['X-App-Access-Ts'] = ts;
  config.headers['X-App-Access-Sig'] = signature.digest('hex');

  return config;
}

export async function createAccessToken(r) {
  try {
    const result = await api.post(`/resources/accessTokens?userId=${r.auth.credentials.id}` +
      `&ttlInSecs=${serverConfig.sumsub.accessTokenTTL}`);

    return output(result.data);
  } catch (err) {
    return error(Errors.SumSubError, err.response.description, err.response.data);
  }
}
