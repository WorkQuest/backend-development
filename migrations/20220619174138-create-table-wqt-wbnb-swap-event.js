'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('WqtWbnbSwapEvents', {
      blockNumber: { type: DataType.INTEGER },
      amountUSD: { type: DataType.STRING },
      amount0In: { type: DataType.STRING },
      amount0Out: { type: DataType.STRING },
      amount1In: { type: DataType.STRING },
      to: { type: DataType.STRING },
      timestamp: { type: DataType.STRING },
      amount1Out: { type: DataType.STRING },
      transactionHash: { type: DataType.STRING },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('WqtWbnbSwapEvents');
  }
};
