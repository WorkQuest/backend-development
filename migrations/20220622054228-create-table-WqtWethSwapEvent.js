'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('WqtWethSwapEvents', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      blockNumber: {
        type: Sequelize.DataTypes.INTEGER
      },
      amountUSD: {
        type: Sequelize.DataTypes.STRING
      },
      amount0In: {
        type: Sequelize.DataTypes.STRING
      },
      amount0Out: {
        type: Sequelize.DataTypes.STRING
      },
      amount1In: {
        type: Sequelize.DataTypes.STRING
      },
      to: {
        type: Sequelize.DataTypes.STRING
      },
      timestamp: {
        type: Sequelize.DataTypes.STRING
      },
      amount1Out: {
        type: Sequelize.DataTypes.STRING
      },
      transactionHash: {
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
    return queryInterface.dropTable('WqtWethSwapEvents');
  }
};