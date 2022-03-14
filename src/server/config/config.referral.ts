import { config } from 'dotenv';

config({ path: __dirname + '/../../../.env.referral' });

export default {
  debug: process.env.BRIDGE_DEBUG === 'true',
  privateKey: process.env.REFERRAL_CONTRACT_PRIVAT_KEY,
};
