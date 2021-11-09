'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestChats', 'isActive')
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestChats', 'isActive', {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    });
  }
};
