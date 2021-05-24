import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Quest } from "./Quest";
import { QuestsResponse } from "./QuestsResponse";

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    dialect: "postgres",
    models: [User, Session, Quest, QuestsResponse]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
