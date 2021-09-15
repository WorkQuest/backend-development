import { config } from "dotenv";

config();

export default {
  dbLink: process.env.DB_LINK,
  auth: {
    jwt: {
      access: {
        secret: process.env.JWT_ACCESS_SECRET,
        lifetime: Number(process.env.JWT_ACCESS_LIFETIME)
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        lifetime: Number(process.env.JWT_REFRESH_LIFETIME)
      }
    }
  },
  server: {
    port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000,
    host: process.env.SERVER_HOST ? process.env.SERVER_HOST : "localhost",
    shutdownTimeout: process.env.SERVER_SHUTDOWN_TIMEOUT ? Number(process.env.SERVER_SHUTDOWN_TIMEOUT) : 15000
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? JSON.parse(process.env.CORS_ORIGINS) : ["*"],
    methods: process.env.CORS_METHODS ? JSON.parse(process.env.CORS_METHODS) : ["POST, GET, OPTIONS"],
    headers: process.env.CORS_HEADERS ? JSON.parse(process.env.CORS_HEADERS) : ["Accept", "Content-Type", "Authorization"],
    maxAge: process.env.CORS_MAX_AGE ? Number(process.env.CORS_MAX_AGE) : 600,
    allowCredentials: process.env.CORS_ALLOW_CREDENTIALS ? process.env.CORS_ALLOW_CREDENTIALS : "true",
    exposeHeaders: process.env.CORS_EXPOSE_HEADERS ? JSON.parse(process.env.CORS_EXPOSE_HEADERS) : ["content-type", "content-length"]
  },
  smtp: {
    sender: process.env.SMTP_SENDER,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  },
  sumsub: {
    appToken: process.env.SUMSUB_APP_TOKEN,
    secretKey: process.env.SUMSUB_SECRET_KEY,
    baseURL: process.env.SUMSUB_BASE_URL,
    accessTokenTTL: process.env.SUMSUB_ACCESS_TOKEN_TTL,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumberSender: process.env.TWILIO_PHONE_NUMBER_SENDER
  },
  socialNetworks: {
    facebook: {
      id: process.env.FACEBOOK_CLIENT_ID,
      secretKey: process.env.FACEBOOK_SECRET_KEY,
      cookiePassword: process.env.FACEBOOK_COOKIE_PASSWORD
    },
    google: {
      id: process.env.GOOGLE_CLIENT_ID,
      secretKey: process.env.GOOGLE_SECRET_KEY,
      cookiePassword: process.env.GOOGLE_COOKIE_PASSWORD
    },
    twitter: {
      id: process.env.TWITTER_CLIENT_ID,
      secretKey: process.env.TWITTER_SECRET_KEY,
      cookiePassword: process.env.TWITTER_COOKIE_PASSWORD
    },
    linkedin: {
      id: process.env.LINKEDIN_CLIENT_ID,
      secretKey: process.env.LINKEDIN_SECRET_KEY,
      cookiePassword: process.env.LINKEDIN_COOKIE_PASSWORD
    },
  },
  cdn: {
    accessKeyId: process.env.CDN_ACCESS_KEY_ID,
    secretAccessKey: process.env.CDN_SECRET_ACCESS_KEY,
    endpoint: process.env.CDN_END_POINT,
    bucket: process.env.CDN_BUCKET,
    pubUrl: process.env.CDN_PUB_END_POINT,
    expiresIn: parseInt(process.env.CDN_EXPIRES_IN),
  },
  baseUrl: process.env.BASE_URL,
  debug: process.env.DEBUG === "true",
  token: {
    WQT:{
      addressWQT: process.env.WQT_ADDRESS_TOKEN,
      decimalsWQT: parseInt(process.env.WQT_DECIMAL_TOKEN),
      symbolWQT: process.env.WQT_SYMBOL_TOKEN,
      nameWQT: process.env.WQT_NAME_TOKEN,
      amountWQTMax:process.env.WQT_AMOUNT_MAX,
    },
    WETH:{
      addressWETH: process.env.WETH_ADDRESS_TOKEN,
      decimalsWETH: parseInt(process.env.WETH_DECIMAL_TOKEN),
      symbolWETH: process.env.WETH_SYMBOL_TOKEN,
      nameWETH: process.env.WETH_NAME_TOKEN,
      amountWETHMax: process.env.WETH_AMOUNT_MAX
    },
  }
};
