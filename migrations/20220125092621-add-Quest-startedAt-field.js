'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'startedAt', {
      type: Sequelize.DataTypes.DATE,
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'startedAt')
  }
};
