'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('WqtWbnbSwapEvents', 'totalUSD', 'amountUSD');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('WqtWbnbSwapEvents', 'amountUSD', 'totalUSD');
  }
};
