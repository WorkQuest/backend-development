'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'assignedWorkerId', {
      type: Sequelize.DataTypes.STRING,
      references: {
        model: {
          tableName: 'Users',
          schema: 'public',
        },
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'assignedWorkerId');
  }
};
