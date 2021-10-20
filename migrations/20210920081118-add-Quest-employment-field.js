'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'employment', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: 'fullTime',
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'employment')
  }
};
