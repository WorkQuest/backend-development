'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestChats', 'workerId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      references: {
        model: {
          tableName: 'Users',
          schema: 'public',
        },
        key: 'id',
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestChats', 'workerId')
  }
};
