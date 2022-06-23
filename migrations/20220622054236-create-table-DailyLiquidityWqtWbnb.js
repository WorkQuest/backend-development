'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('DailyLiquidityWqtWbnb', {
      daySinceEpochBeginning: {
        primaryKey: true,
        type: Sequelize.DataTypes.INTEGER
      },
      date: {
        type: Sequelize.DataTypes.INTEGER
      },
      blockNumber: {
        type: Sequelize.DataTypes.STRING
      },
      bnbPool: {
        type: Sequelize.DataTypes.STRING
      },
      wqtPool: {
        type: Sequelize.DataTypes.STRING
      },
      usdPriceBNB: {
        type: Sequelize.DataTypes.STRING
      },
      usdPriceWQT: {
        type: Sequelize.DataTypes.STRING
      },
      reserveUSD: {
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
    return queryInterface.dropTable('DailyLiquidityWqtWbnb');
  }
};