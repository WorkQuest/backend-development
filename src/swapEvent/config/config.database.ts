import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.swapEvent'});

export default {
  dbLink: process.env.DB_LINK,
}
