import { config } from 'dotenv';

config({ path: __dirname + '/../../../.env.bridge' });

export default {
  privateKey: process.env.BRIDGE_CONTRACT_PRIVAT_KEY,
};
