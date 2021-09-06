'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Messages', 'actionUserId', {
      type: Sequelize.DataTypes.STRING,
      references: {
        model: {
          tableName: 'Users',
          schema: 'public'
        },
        key: 'id'
      }
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'actionUserId')
  }
};
