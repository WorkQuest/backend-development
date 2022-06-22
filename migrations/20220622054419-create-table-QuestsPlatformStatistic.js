'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestsPlatformStatistics', {
      total: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      sum: {
        type: Sequelize.DataTypes.DECIMAL,
        defaultValue: '0'
      },
      closed: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      dispute: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      blocked: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      pending: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      recruitment: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      waitingForConfirmFromWorkerOnAssign: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      executionOfWork: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      waitingForEmployerConfirmationWork: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      completed: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      date: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: 1655895098042,
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
    return queryInterface.dropTable('QuestsPlatformStatistics');
  }
};