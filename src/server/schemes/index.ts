import * as Joi from '@hapi/joi';

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
