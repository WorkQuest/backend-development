import { v4 as uuidv4 } from 'uuid';
import { Boom } from '@hapi/boom';
import * as crypto from 'crypto';
import config from '../config/config';
const geoip = require('geoip-lite');

export function getUUID(): string {
  return uuidv4();
}

export function getRealIp(request): string {
  if (request.headers['x-forwarded-for']) {
    return request.headers['x-forwarded-for'];
  }
  if (request.headers['X-Forwarded-For']) {
    return request.headers['X-Forwarded-For'];
  }

  return request.info.remoteAddress;
}

//DO NOT WORK WITH LOCAL IP
export function getGeo(request) {
  if (config.debug) {
    return {
      country: 'localhost',
      city: 'localhost',
    };
  }

  const ip = getRealIp(request);
  const geo = geoip.lookup(ip);

  return {
    country: geo ? geo.country : null,
    city: geo ? geo.city : null,
  }
}

export function getDevice(request): string {
  return request.headers['user-agent'];
}

export function output(result?: any | null): { ok: boolean; result: any | null } {
  return { ok: true, result };
}

export interface OutputInterface {
  ok: boolean;
  result?: object;
}

export function error(code: number, msg: string, data: object): Boom {
  return new Boom(msg, {
    data: {
      code,
      data,
      api: true,
    },
    statusCode: Math.floor(code / 1000),
  });
}

export function responseHandler(r, h) {
  // Handle default hapi errors (like not found, etc.)
  if (r.response.isBoom && r.response.data === null) {
    r.response = h
      .response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: {},
        msg: r.response.message,
      })
      .code(r.response.output.statusCode);

    return h.continue;
  }
  // Handle custom api error
  if (r.response.isBoom && r.response.data.api) {
    r.response = h
      .response({
        ok: false,
        code: r.response.data.code,
        data: r.response.data.data,
        msg: r.response.output.payload.message,
      })
      .code(Math.floor(r.response.data.code / 1000));

    return h.continue;
  }
  // Handle non api errors with data
  if (r.response.isBoom && !r.response.data.api) {
    r.response = h
      .response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: r.response.data,
        msg: r.response.message,
      })
      .code(r.response.output.statusCode);

    return h.continue;
  }

  return h.continue;
}

export function getRandomHexToken(): string {
  return crypto.randomBytes(20).toString('hex');
}

export function getRandomCodeNumber(): number {
  // @ts-ignore
  return crypto.randomInt(100000, 999999);
}

export async function handleValidationError(r, h, err) {
  return error(
    400000,
    'Validation error',
    err.details.map((e) => {
      return { field: e.context.key, reason: e.type.replace('any.', '') };
    }),
  );
}
