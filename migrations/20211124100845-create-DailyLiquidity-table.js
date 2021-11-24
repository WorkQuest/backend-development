'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('DailyLiquidities', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      timestamp: {
        type: Sequelize.DataTypes.STRING
      },
      blockNumber: {
        type: Sequelize.DataTypes.STRING
      },
      bnbPool: {
        type: Sequelize.DataTypes.DECIMAL
      },
      wqtPool: {
        type: Sequelize.DataTypes.DECIMAL
      },
      usdPriceBNB: {
        type: Sequelize.DataTypes.DECIMAL
      },
      usdPriceWQT: {
        type: Sequelize.DataTypes.DECIMAL
      },
      liquidityPoolUSD: {
        type: Sequelize.DataTypes.DECIMAL
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DailyLiquidities');
  }
};
