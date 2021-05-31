import axios from 'axios';
import * as crypto from 'crypto';
import serverConfig from '../config/config';
import { error, output } from '../utils';
import * as FormData from 'form-data';
import { Errors } from '../utils/errors';
import { StatusKYC, User } from '../models/User';

export enum ReviewAnswer {
  Red = "RED",
  Green = "GREEN",
}

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
});

function checkDigest(r): boolean {
  const calculatedDigest = crypto
    .createHmac('sha1', serverConfig.sumsub.secretKey)
    .update(r.payload)
    .digest('hex')

  return calculatedDigest === r.headers['x-payload-digest']
}

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
  if (r.auth.credentials.statusKYC === StatusKYC.Confirmed) {
    return error(Errors.KYCAlreadyVerified, "User already verified", {});
  }

  try {
    const result = await api.post(`/resources/accessTokens?userId=${r.auth.credentials.id}` +
      `&ttlInSecs=${serverConfig.sumsub.accessTokenTTL}`);

    return output(result.data);
  } catch (err) {
    return error(Errors.SumSubError, err.response.description, err.response.data);
  }
}

export async function applicantReviewed(r) {
  if (!checkDigest(r)) {
    return error(Errors.InvalidPayload, "x-payload-digest failed", {});
  }

  const payload = JSON.parse(r.payload.toString())
  if (payload.reviewResult.reviewAnswer !== ReviewAnswer.Green) {
    return error(Errors.InvalidPayload, "Applicant not reviewed", {});
  }

  const user = await User.findOne({ where: { id: payload.externalUserId } });

  if (!user) {
    return error(Errors.NotFound, "User not found", {});
  }
  if (user.statusKYC === StatusKYC.Confirmed) {
    return error(Errors.KYCAlreadyVerified, "User already verified", {});
  }

  await user.update({ statusKYC: StatusKYC.Confirmed });

  return output();
}
