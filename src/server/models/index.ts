import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Point } from "./Point";
import { Quest } from "./Quest";
import { QuestsResponse } from "./QuestsResponse";

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    dialect: "postgres",
    models: [User, Session, Point, Quest, QuestsResponse]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
