'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('DailyLiquidities', 'DailyLiquidityWqtWbnb');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('DailyLiquidityWqtWbnb', 'DailyLiquidities');
  }
};
