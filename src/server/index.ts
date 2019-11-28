import * as Hapi from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';
import * as Bell from '@hapi/bell';
import * as Basic from '@hapi/basic';
import * as dotenv from 'dotenv';

const HapiSwagger = require('hapi-swagger');

const Package = require('../../package.json');
import * as Config from './config/server.json';

import * as SwaggerOptions from './config/swagger.json';
SwaggerOptions.info.version = Package.version;

import routes from './routes/public';
import basicAuthHandler from './utils/auth';

const init = async () => {
  // Инициализируем сервер
  dotenv.config();
  const server = await new Hapi.Server(Config.server);

  // Регистрируем расширения
  await server.register([
    Bell,
    Basic,
    Nes,
    Inert,
    Vision,
    Pino,
    { plugin: HapiSwagger, options: SwaggerOptions }
  ]);

  // Авторизация через соцсети
  server.auth.strategy('google', 'bell', {
    provider: 'Google',
    clientId: process.env.auth_google_id,
    clientSecret: process.env.auth_google_secret,
    password: process.env.auth_google_secret,
    isSecure: false
  });
  server.auth.strategy('fb', 'bell', {
    provider: 'Facebook',
    clientId: Number(process.env.auth_fb_id),
    clientSecret: process.env.auth_fb_secret,
    password: process.env.auth_fb_cookie_password,
    isSecure: false
  });
  server.auth.strategy('vk', 'bell', {
    provider: 'VK',
    clientId: Number(process.env.auth_vk_id),
    clientSecret: process.env.auth_vk_secret,
    password: process.env.auth_vk_cookie_password,
    isSecure: false
  });

  // Авторизация стандартная (логин+пароль)
  server.auth.strategy('simple', 'basic', { basicAuthHandler });

  // Загружаем маршруты
  server.route(routes);

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
