import * as Hapi from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';
import * as Basic from '@hapi/basic';
import * as SwaggerOptions from './config/swagger.json';
import * as HapiCors from 'hapi-cors'
import * as HapiBearer from 'hapi-auth-bearer-token';
import routes from './routes';
import config from './config/config';
import { handleValidationError, responseHandler } from './utils';
import { accessValidate, refreshValidate } from './utils/auth';

const HapiSwagger = require('hapi-swagger');

const Package = require('../../package.json');

SwaggerOptions.info.version = Package.version;

const init = async () => {
  const server = await new Hapi.Server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      validate: {
        options: {
          // Handle all validation errors
          abortEarly: false
        },
        failAction: handleValidationError
      },
      response: {
        failAction: 'log'
      }
    }
  });
  server.realm.modifiers.route.prefix = '/api';
  // Регистрируем расширения
  await server.register([
    Basic,
    Nes,
    Inert,
    Vision,
    Pino,
    HapiBearer,
    { plugin: HapiSwagger, options: SwaggerOptions }
  ]);

  // Авторизация через соцсети
  // server.auth.strategy('google', 'bell', {
  //   provider: 'Google',
  //   clientId: process.env.auth_google_id,
  //   clientSecret: process.env.auth_google_secret,
  //   password: process.env.auth_google_secret,
  //   isSecure: false
  // });
  // server.auth.strategy('fb', 'bell', {
  //   provider: 'Facebook',
  //   clientId: Number(process.env.auth_fb_id),
  //   clientSecret: process.env.auth_fb_secret,
  //   password: process.env.auth_fb_cookie_password,
  //   isSecure: false
  // });
  // server.auth.strategy('vk', 'bell', {
  //   provider: 'VK',
  //   clientId: Number(process.env.auth_vk_id),
  //   clientSecret: process.env.auth_vk_secret,
  //   password: process.env.auth_vk_cookie_password,
  //   isSecure: false
  // });

  // Авторизация стандартная (логин+пароль)
  // server.auth.strategy('simple', 'basic', { validate: basicAuthHandler });

  // JWT Auth
  server.auth.strategy('jwt-access', 'bearer-access-token', {
    validate: accessValidate
  });
  server.auth.strategy('jwt-refresh', 'bearer-access-token', {
    validate: refreshValidate
  });

  server.auth.default('jwt-access')

  // Загружаем маршруты
  server.route(routes);
  // Error handler
  server.ext('onPreResponse', responseHandler);
  // Enable CORS (Do it last required!)
  await server.register({
    plugin: HapiCors,
    options: config.cors
  })
  // Запускаем сервер
  try {
    await server.start();
    server.log('info', `Server running at: ${server.info.uri}`);
  } catch (err) {
    server.log('error', JSON.stringify(err));
  }

  return server;
};

export { init };
