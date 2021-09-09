import * as Hapi from "@hapi/hapi";
import * as Nes from "@hapi/nes";
import * as Inert from "@hapi/inert";
import * as Vision from "@hapi/vision";
import * as Pino from "hapi-pino";
import * as Basic from "@hapi/basic";
import * as HapiCors from "hapi-cors";
import * as HapiBearer from "hapi-auth-bearer-token";
import * as HapiPulse from "hapi-pulse";
import * as Bell from "@hapi/bell";
import { initDatabase } from "@workquest/database-models/lib/models";
import routes from "./routes";
import config from "./config/config";
import * as Qs from "qs";
import { handleValidationError, responseHandler } from "./utils";
import { chatNotificationsFilter } from "./utils/chatSubscription";
import { tokenValidate } from "./utils/auth";
import SwaggerOptions from "./config/swagger";
import { pinoConfig } from "./config/pino";
import { run } from "graphile-worker";
import * as grScheduler from 'graphile-scheduler';
import { deactivateSessionsJob } from "./jobs/deactivateSessions";
const HapiSwagger = require("hapi-swagger");
const Package = require("../../package.json");

SwaggerOptions.info.version = Package.version;

function initAuthStrategiesOfSocialNetworks(server: Hapi.Server) {
  server.auth.strategy('facebook', 'bell', {
    provider: "facebook",
    clientId: config.socialNetworks.facebook.id,
    password: config.socialNetworks.facebook.cookiePassword,
    clientSecret: config.socialNetworks.facebook.secretKey,
    isSecure: !config.debug,
    location: config.baseUrl
  });
  server.auth.strategy('google', 'bell', {
    provider: "google",
    clientId: config.socialNetworks.google.id,
    password: config.socialNetworks.google.cookiePassword,
    clientSecret: config.socialNetworks.google.secretKey,
    isSecure: !config.debug,
    location: config.baseUrl
  });
  server.auth.strategy('twitter', 'bell', {
    provider: "twitter",
    clientId: config.socialNetworks.twitter.id,
    password: config.socialNetworks.twitter.cookiePassword,
    clientSecret: config.socialNetworks.twitter.secretKey,
    isSecure: !config.debug,
    location: config.baseUrl
  });
  server.auth.strategy('linkedin', 'bell', {
    provider: "linkedin",
    clientId: config.socialNetworks.linkedin.id,
    password: config.socialNetworks.linkedin.cookiePassword,
    clientSecret: config.socialNetworks.linkedin.secretKey,
    isSecure: !config.debug,
    location: config.baseUrl
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
  server.app.db = await initDatabase(config.dbLink, true, true);
  server.app.scheduler = await run({
    connectionString: config.dbLink,
    concurrency: 5,
    pollInterval: 1000,
    taskDirectory: `${__dirname}/jobs` // Папка с исполняемыми тасками.
  });

  server.subscription('/notifications/chat', {
    filter: chatNotificationsFilter
  server.app.grScheduler = await grScheduler.run({
    connectionString: config.dbLink,
    schedules: [
      {
        name: 'deactivateSessions',
        pattern: '00 00 * * *', //every day in 12:00 am
        timeZone: 'Europe/Moscow',
        task: deactivateSessionsJob,
      },
    ]
  });

  server.subscription('/notifications', {
    filter: async function(path, message, options): Promise<boolean> {
      return message.userId ? (message.userId === options.credentials.id) : true;
    }
  });

  // JWT Auth
  server.auth.strategy('jwt-access', 'bearer-access-token', {
    validate: tokenValidate('access', [
      "/api/v1/auth/confirm-email",
      "/api/v1/profile/set-role",
    ]),
  });
  server.auth.strategy('jwt-refresh', 'bearer-access-token', {
    validate: tokenValidate('refresh', [
      "/v1/auth/refresh-tokens"
    ]),
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
