import { Sequelize } from "sequelize-typescript";
import config from "../config/config";
import { User } from "./User";
import { Session } from "./Session";
import { Point } from "./Point";

const sequelize = new Sequelize(config.dbLink, {
  dialect: "postgres",
  models: [User, Session, Point]
});
sequelize.sync();
export default sequelize;
