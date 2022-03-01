'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('StarredQuests', 'QuestsStarred');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('QuestsStarred', 'StarredQuests');
  }
};
