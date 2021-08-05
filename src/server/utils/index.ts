import { v4 as uuidv4 } from "uuid";
import { Boom } from "@hapi/boom";
import * as crypto from "crypto";

export function getUUID(): string {
  return uuidv4();
}

export function getRealIp(request): string {
  return request.headers["cf-connecting-ip"] ?
    request.headers["cf-connecting-ip"] :
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

export function responseHandler(r, h) {
  // Handle default hapi errors (like not found, etc.)
  if (r.response.isBoom && r.response.data === null) {
    r.response = h.response({
      ok: false,
      code: Math.floor(r.response.output.statusCode * 1000),
      data: {},
      msg: r.response.message
    }).code(r.response.output.statusCode)
    return h.continue;
  }
  // Handle custom api error
  if (r.response.isBoom && r.response.data.api) {
    r.response = h.response({
      ok: false,
      code: r.response.data.code,
      data: r.response.data.data,
      msg: r.response.output.payload.message
    }).code(Math.floor(r.response.data.code / 1000));
    return h.continue;
  }
  // Handle non api errors with data
  if (r.response.isBoom && !r.response.data.api) {
    r.response = h.response({
      ok: false,
      code: Math.floor(r.response.output.statusCode * 1000),
      data: r.response.data,
      msg: r.response.message
    }).code(r.response.output.statusCode)
    return h.continue;
  }

  return h.continue;

}

export function getRandomHexToken(): string {
  return crypto.randomBytes(20).toString("hex");
}

export function getRandomCodeNumber(): number {
  return crypto.randomInt(100000, 999999);
}

export async function handleValidationError(r, h, err) {
  return error(400000, "Validation error", err.details.map(e => {
      return { field: e.context.key, reason: e.type.replace("any.", "") };
    })
  );
}
