'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestDisputeDecisionData', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      disputeId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      transactionHashDisputeResolution: {
        type: Sequelize.DataTypes.STRING
      },
      decision: {
        type: Sequelize.DataTypes.STRING
      },
      gasPriceAtMoment: {
        type: Sequelize.DataTypes.INTEGER
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      error: {
        type: Sequelize.DataTypes.STRING
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
    return queryInterface.dropTable('QuestDisputeDecisionData');
  }
};