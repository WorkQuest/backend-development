const pino = require("pino");

export const pinoConfig = (prettify?: boolean) => ({
  prettyPrint: prettify
    ? {
      colorize: true,
      crlf: false,
      jsonPretty: false,
      translateTime: "yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname,v,tags,data",
      messageFormat: "{data}",
      customPrettifiers: {
        response: { messageFormat: "{req.url} - {req.method} - code:{req.statusCode}" }
      }
    }
    : false,
  redact: { paths: ["payload.password", "req.headers.authorization"], censor: "***" },
  serializers: {
    // req: (req) => {
    //   return {
    //     headers: req.headers,
    //     method: req.method
    //   }
    // },
    res: function customResSerializer(res) {
      return {
        code: res.statusCode
      };
    }
  },
  logPayload: true,
  logEvents: ['response', 'request'],
  logQueryParams: true,
  formatters: {
    req: (req) => ({
      method: req.method
    }),
    level() {
      return {};
    },
    bindings() {
      return {};
    },
    tags() {
      return {};
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
  // timestamp: () => `,"time":"${new Date(Date.now()).toLocaleString()}"`,
});
