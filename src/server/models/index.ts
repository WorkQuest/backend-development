import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Quest } from "./Quest";
import { QuestsResponse } from "./QuestsResponse";
import { Media } from './Media';
import { QuestMedia } from './QuestMedia';
import { Review } from './Review';

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    logging,
    dialect: "postgres",
    models: [User, Session, Quest, QuestsResponse, Media, QuestMedia, Review]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
