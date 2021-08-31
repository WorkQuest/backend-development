'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('QuestsStatistics', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
      completed: {
        type: Sequelize.DataTypes.INTEGER,
      },
      opened: {
        type: Sequelize.DataTypes.INTEGER,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('QuestsStatistics');
  }
};
