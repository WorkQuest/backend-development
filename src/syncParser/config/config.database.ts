import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.syncParser'});

export default {
  dbLink: process.env.DB_LINK,
}
