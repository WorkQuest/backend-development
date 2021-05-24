'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestsResponse', 'userId', 'workerId');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestsResponse', 'workerId', 'userId');
  }
};
