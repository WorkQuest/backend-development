import { Sequelize } from "sequelize-typescript";
import { User } from "./User";
import { Session } from "./Session";
import { Quest } from "./Quest";
import { QuestsResponse } from "./QuestsResponse";
import { Media } from "./Media";
import { QuestMedia } from "./QuestMedia";
import { Review } from "./Review";
import { RatingStatistic } from "./RatingStatistic";
import { StarredQuests } from './StarredQuests';
import { PortfolioMedia } from './PortfolioMedia';
import { Portfolio } from './Portfolio';
import {News} from './News'
import { LikeNews } from "./LikeNews";
import { CommentMedia } from "./CommentMedia";
import { Comment } from "./Comment";
import { NewsMedia } from "./NewsMedia";

export async function initDatabase(dbLink: string, logging = false, sync = false) {
  const sequelize = new Sequelize(dbLink, {
    logging,
    dialect: "postgres",
    models: [ StarredQuests,
      User,
      Session,
      Quest,
      QuestsResponse,
      Media,
      QuestMedia,
      Review,
      RatingStatistic,
      Portfolio,
      PortfolioMedia,
      News,
      LikeNews,
      CommentMedia,
      NewsMedia,
      Comment
    ]
  });
  if (sync)
    await sequelize.sync();

  return sequelize;
}
