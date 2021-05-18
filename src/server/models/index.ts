import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Quest } from "./Quest";

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    dialect: "postgres",
    models: [User, Session, Quest]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
