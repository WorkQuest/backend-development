import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.swapParser'});

export default {
  dbLink: process.env.DB_LINK,
}
