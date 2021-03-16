import * as Joi from "joi";

export const outputOkSchema = (res: Joi.Schema): Joi.Schema => {
  return Joi.object({
    ok: Joi.boolean().example(true),
    result: res
  });
};

export function outputPaginationSchema(title: string, item: Joi.Schema): Joi.Schema {
  return Joi.object({
    ok: Joi.boolean().example(true),
    result: Joi.object({
      count: Joi.number().integer().example(10),
      [title]: Joi.array().items(item)
    })
  });
}

export const hexTokenSchema = Joi.string().regex(/^[0-9a-fA-F]{40}$/).example("9997632b8e470e6fc7b48fac0528f06b5581ac29").label("HexToken");
export const totpSchema = Joi.string().regex(/^\d{6}$/).example("123456").label("Totp");

export const emptyOkSchema = Joi.object({
  ok: Joi.boolean().example(true)
}).label("EmptyOkResponse");

export const jwtTokens = Joi.object({
  access: Joi.string().example("access jwt token"),
  refresh: Joi.string().example("refresh jwt token")
}).label("JwtTokensSchema");
