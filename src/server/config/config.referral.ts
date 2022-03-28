import { config } from 'dotenv';

config({ path: __dirname + '/../../../.env.referral' });

export default {
  privateKey: process.env.REFERRAL_CONTRACT_PRIVAT_KEY,
};
