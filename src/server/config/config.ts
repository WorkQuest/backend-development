import { config } from "dotenv";

config();

export default {
  baseUrl: process.env.BASE_URL,
  debug: process.env.DEBUG === "true",
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
    local: process.env.LOCAL ? process.env.LOCAL === "true" : false,
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
  token: {
    WQT: {
      bscNetwork: {
        address: process.env.TOKEN_WQT_BSC_NETWORK_ADDRESS,
        decimals: parseInt(process.env.TOKEN_WQT_BSC_NETWORK_DECIMAL),
        symbol: process.env.TOKEN_WQT_BSC_NETWORK_SYMBOL,
        name: process.env.TOKEN_WQT_BSC_NETWORK_NAME,
        amountMax: process.env.TOKEN_WQT_BSC_NETWORK_AMOUNT_MAX,
      },
      ethereumNetwork: {
        address: process.env.TOKEN_WQT_ETHEREUM_NETWORK_ADDRESS,
        decimals: parseInt(process.env.TOKEN_WQT_ETHEREUM_NETWORK_DECIMAL),
        symbol: process.env.TOKEN_WQT_ETHEREUM_NETWORK_SYMBOL,
        name: process.env.TOKEN_WQT_ETHEREUM_NETWORK_NAME,
        amountMax:process.env.TOKEN_WQT_ETHEREUM_NETWORK_AMOUNT_MAX,
      }
    },
    WETH: {
      address: process.env.TOKEN_WETH_ADDRESS,
      decimals: parseInt(process.env.TOKEN_WETH_DECIMAL),
      symbol: process.env.TOKEN_WETH_SYMBOL,
      name: process.env.TOKEN_WETH_NAME,
      amountMax: process.env.TOKEN_WETH_AMOUNT_MAX,
    },
    WBNB: {
      address: process.env.TOKEN_WBNB_ADDRESS,
      decimals: parseInt(process.env.TOKEN_WBNB_DECIMAL),
      symbol: process.env.TOKEN_WBNB_SYMBOL,
      name: process.env.TOKEN_WBNB_NAME,
      amountMax: process.env.TOKEN_WBNB_AMOUNT_MAX,
    },
  },
  contracts: {
    liquidityMining: {
      webSocketProvider: process.env.CONTRACT_LIQUIDITY_MINING_WEBSOCKET_PROVIDER,
      contract: process.env.CONTRACT_LIQUIDITY_MINING_ADDRESS,
    }
  }
};
