import config from '../../config/config';
import { Sequelize } from 'sequelize-typescript';
import models from '@workquest/database-models/lib/models/common-models';

export default class Database extends Sequelize {
  private static _instance: Database;

  static instance(): Database {
    if (!Database._instance) {
      Database._instance = new Database();
    }

    return Database._instance;
  }

  private constructor() {
    super(config.dbLink, {
      dialect: 'postgres',
      dialectOptions: {
        connectTimeout: 60000
      },
      logging: false,
      models: models,
    });
  }
}

