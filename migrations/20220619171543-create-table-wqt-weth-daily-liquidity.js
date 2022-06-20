'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('DailyLiquidityWqtWeth', {
      daySinceEpochBeginning: { type: Sequelize.DataTypes.STRING, primaryKey: true },
      date: { type: Sequelize.DataTypes.INTEGER },
      blockNumber: { type: Sequelize.DataTypes.STRING },
      ethPool: { type: Sequelize.DataTypes.STRING },
      wqtPool: { type: Sequelize.DataTypes.STRING },
      usdPriceETH: { type: Sequelize.DataTypes.STRING },
      usdPriceWQT: { type: Sequelize.DataTypes.STRING },
      reserveUSD: { type: Sequelize.DataTypes.STRING },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('DailyLiquidityWqtWeth');
  }
};
