'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestsResponses', 'userId', 'workerId');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestsResponses', 'workerId', 'userId');
  }
};
