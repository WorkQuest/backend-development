'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('DailyLiquidityWqtWbnb', {
      daySinceEpochBeginning: { type: Sequelize.DataTypes.STRING, primaryKey: true },
      date: { type: Sequelize.DataTypes.INTEGER },
      blockNumber: { type: Sequelize.DataTypes.STRING },
      bnbPool: { type: Sequelize.DataTypes.STRING },
      wqtPool: { type: Sequelize.DataTypes.STRING },
      usdPriceBNB: { type: Sequelize.DataTypes.STRING },
      usdPriceWQT: { type: Sequelize.DataTypes.STRING },
      reserveUSD: { type: Sequelize.DataTypes.STRING },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('DailyLiquidityWqtWbnb');
  }
};
