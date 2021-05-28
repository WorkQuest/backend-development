'use strict';

import { DataType } from 'sequelize-typescript';
import { StatusKYC } from '../src/server/models/User';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('User', 'statusKYC', {
      type: DataType.INTEGER,
      defaultValue: StatusKYC.Unconfirmed
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('User', 'statusKYC')
  }
};
