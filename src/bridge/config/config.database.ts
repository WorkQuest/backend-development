import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.bridge'});

export default {
  dbLink: process.env.DB_LINK,
}
