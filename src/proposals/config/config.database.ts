import {config} from "dotenv";

config();

export default {
  dbLink: process.env.DB_LINK,
}
