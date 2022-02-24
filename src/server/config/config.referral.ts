import { config } from 'dotenv';

config({ path: __dirname + '/../../../.env.referral' });

export default {
  debug: process.env.BRIDGE_DEBUG === 'true',
  wssProviderLink: process.env.REFERRAL_WEBSOCKET_PROVIDER,
  privateKey: process.env.REFERRAL_CONTRACT_PRIVAT_KEY,
};
