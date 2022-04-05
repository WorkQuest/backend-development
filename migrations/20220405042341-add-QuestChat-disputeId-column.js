'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestChats', 'disputeId', {
      type: Sequelize.DataTypes.STRING,
      references: {
        model: {
          tableName: 'QuestDisputes',
          schema: 'public',
        },
        key: 'id'
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestChats', 'disputeId')
  }
};
