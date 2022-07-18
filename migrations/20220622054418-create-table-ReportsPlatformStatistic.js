'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ReportsPlatformStatistics', {
      users: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      declinedUsers: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      decidedUsers: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      quests: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      declinedQuests: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      decidedQuests: {
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
    return queryInterface.dropTable('ReportsPlatformStatistics');
  }
};