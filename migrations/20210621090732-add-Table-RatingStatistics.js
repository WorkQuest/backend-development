'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('RatingStatistics', {
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
      reviewCount: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
      },
      averageMark: {
        type: Sequelize.DataTypes.DOUBLE,
        defaultValue: null,
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
    return queryInterface.dropTable('RatingStatistics');
  }
};
