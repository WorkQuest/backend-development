import * as Joi from '@hapi/joi';

export const outputOkSchema = (res: Joi.object): Joi.object => {
  return Joi.object({
    ok: Joi.boolean().example(true),
    result: res
  });
};

export function outputPaginationSchema(title: string, item: Joi.object): Joi.object {
  return Joi.object({
    ok: Joi.boolead().example(true),
    result: Joi.object({
      count: Joi.number().integer().example(10),
      [title]: Joi.array().items(item)
    })
  })
}

const user = Joi.object({
  name: Joi.string(),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(6)
    .required()
});

export { user };
