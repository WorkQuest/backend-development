import * as Hapi from "@hapi/hapi";
import * as Nes from "@hapi/nes";
import * as Inert from "@hapi/inert";
import * as Vision from "@hapi/vision";
import * as Pino from "hapi-pino";
import * as Basic from "@hapi/basic";
import * as HapiCors from "hapi-cors";
import * as HapiBearer from "hapi-auth-bearer-token";
import * as HapiPulse from "hapi-pulse";
import * as Bell from "@hapi/bell"
import routes from "./routes";
import config from "./config/config";
import * as Qs from "qs";
import { handleValidationError, responseHandler } from "./utils";
import { tokenValidate } from "./utils/auth";
import SwaggerOptions from "./config/swagger";
import { pinoConfig } from "./config/pino";
import { initDatabase } from "./models";
import { run } from "graphile-worker";

const HapiSwagger = require("hapi-swagger");
const Package = require("../../package.json");

SwaggerOptions.info.version = Package.version;

function initAuthStrategiesOfSocialNetworks(server: Hapi.Server) {
  server.auth.strategy('facebook', 'bell', {
    provider: 'facebook',
    clientId: config.socialNetworks.facebook.id,
    password: 'cookie_encryption_password_secure',
    clientSecret: config.socialNetworks.facebook.secretKey,
    isSecure: !config.debug
  });
  server.auth.strategy('google', 'bell', {
    provider: 'google',
    clientId: config.socialNetworks.google.id,
    password: 'cookie_encryption_password_secure',
    clientSecret: config.socialNetworks.google.secretKey,
    isSecure: !config.debug
  });
  server.auth.strategy('twitter', 'bell', {
    provider: 'twitter',
    clientId: config.socialNetworks.twitter.id,
    password: 'cookie_encryption_password_secure',
    clientSecret: config.socialNetworks.twitter.secretKey,
    isSecure: !config.debug
  });
  server.auth.strategy('linkedin', 'bell', {
    provider: 'linkedin',
    clientId: config.socialNetworks.linkedin.id,
    password: 'cookie_encryption_password_secure',
    clientSecret: config.socialNetworks.linkedin.secretKey,
    isSecure: !config.debug
  });
}

const init = async () => {
  const server = await new Hapi.Server({
    port: config.server.port,
    host: config.server.host,
    query: {
      parser: (query) => Qs.parse(query)
    },
    routes: {
      validate: {
        options: {
          // Handle all validation errors
          abortEarly: false,
        },
        failAction: handleValidationError,
      },
      response: {
        failAction: 'log',
      },
    },
  });
  server.realm.modifiers.route.prefix = '/api';
  // Регистрируем расширения
  await server.register([
    Basic,
    Nes,
    Inert,
    Vision,
    HapiBearer,
    Bell,
    { plugin: Pino, options: pinoConfig(false) },
    { plugin: HapiSwagger, options: SwaggerOptions }
  ]);
  server.app.db = await initDatabase(config.dbLink, false, true);
  server.app.scheduler = await run({
    connectionString: config.dbLink,
    concurrency: 5,
    pollInterval: 1000,
    taskDirectory: `${__dirname}/jobs` // Папка с исполняемыми тасками.
  });

  // JWT Auth
  server.auth.strategy('jwt-access', 'bearer-access-token', {
    validate: tokenValidate('access', ["/api/v1/auth/confirm-email"]),
  });
  server.auth.strategy('jwt-refresh', 'bearer-access-token', {
    validate: tokenValidate('refresh'),
  });
  server.auth.default('jwt-access');

  initAuthStrategiesOfSocialNetworks(server);

  // Загружаем маршруты
  server.route(routes);
  // Error handler
  server.ext('onPreResponse', responseHandler);
  await server.register({
    plugin: HapiPulse,
    options: {
      timeout: 15000,
      signals: ['SIGINT'],
    },
  });
  // Enable CORS (Do it last required!)
  await server.register({
    plugin: HapiCors,
    options: config.cors,
  });
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
