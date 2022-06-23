'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('DisputesPlatformStatistics', {
      total: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      pending: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      created: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      inProgress: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      pendingClosed: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      closed: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      date: {
        type: Sequelize.DataTypes.DATE,
        primaryKey: true
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
    return queryInterface.dropTable('DisputesPlatformStatistics');
  }
};