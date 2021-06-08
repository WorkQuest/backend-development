'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'workerId', {
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
    return queryInterface.removeColumn('Quests', 'workerId');
  }
};
