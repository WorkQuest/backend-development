'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('RatingStatistics', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      reviewCount: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      averageMark: {
        type: Sequelize.DataTypes.DOUBLE PRECISION,
        defaultValue: null
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('RatingStatistics');
  }
};