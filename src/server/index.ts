import * as Hapi from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';
import * as Bell from '@hapi/bell';
import * as Basic from '@hapi/basic';
import {basicAuthHandler} from './utils/auth';

const HapiSwagger = require('hapi-swagger');

const Package = require('../../package.json');
import * as Config from './config/server.json';

import * as SwaggerOptions from './config/swagger.json';
SwaggerOptions.info.version = Package.version;

import routes from './routes/public';

const init = async () => {
  // Инициализируем сервер
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
    clientId: Config.auth.google.id,
    clientSecret: Config.auth.google.secret,
    password: Config.auth.google.cookie_password,
    isSecure: false
  });
  server.auth.strategy('fb', 'bell', {
    provider: 'Facebook',
    clientId: Config.auth.fb.id,
    clientSecret: Config.auth.fb.secret,
    password: Config.auth.fb.cookie_password,
    isSecure: false
  });
  server.auth.strategy('vk', 'bell', {
    provider: 'VK',
    clientId: Config.auth.vk.id,
    clientSecret: Config.auth.vk.secret,
    password: Config.auth.vk.cookie_password,
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
