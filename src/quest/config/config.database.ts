import {config} from "dotenv";

config({ path: __dirname +  '/../../../.env.quest'});

export default {
  dbLink: process.env.DB_LINK,
}

