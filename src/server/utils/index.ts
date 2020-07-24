import { v4 as uuidv4 } from 'uuid';
import { Boom } from '@hapi/boom';
import * as speakeasy from 'speakeasy';

export function getUUID(): string {
  return uuidv4();
}

export function getRealIp(request): string{
  return request.headers['cf-connecting-ip'] ?
    request.headers['cf-connecting-ip'] :
    request.info.remoteAddress;
}

export function output(res?: object | null): object {
  return {
    ok: true,
    result: res
  };
}

export function error(code: number, msg: string, data: object): Boom {
  return new Boom(msg, {
    data: {
      code,
      data,
      api: true
    },
    statusCode: Math.floor(code / 1000)
  });
}

export function totpValidate(totp: string, secret: string): boolean{
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: Number(totp)
  });
}

export function responseHandler(r, h) {
  if (r.response.isBoom && r.response.data) {
    if (r.response.data.custom) {
      r.response = h.response({
        ok: false,
        code: r.response.data.code,
        data: r.response.data.data,
        msg: r.response.output.payload.message
      }).code(Math.floor(r.response.data.code / 1000));
      return h.continue;
    } else {
      r.response = h.response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: {},
        msg: r.response.message
      })
      return h.continue;
    }
  } else {
    return h.continue;
  }
}

export async function handleValidationError(r, h, err){
  return error(400000, 'Validation error', {
    errors: err.details.map(e => {
      return { field: e.context.key, reason: e.type.replace('any.', '') };
    })
  });
}
