import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Point } from "./Point";
import { Quest } from "./Quest";

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    dialect: "postgres",
    models: [User, Session, Point, Quest]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
