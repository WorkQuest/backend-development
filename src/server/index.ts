import * as Hapi from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';

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
    Nes,
    Inert,
    Vision,
    Pino,
    { plugin: HapiSwagger, options: SwaggerOptions }
  ]);

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
