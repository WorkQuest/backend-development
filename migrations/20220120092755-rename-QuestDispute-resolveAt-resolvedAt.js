'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestDisputes', 'resolveAt', 'resolvedAt');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('QuestDisputes', 'resolvedAt', 'resolveAt');
  }
};
