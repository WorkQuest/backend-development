'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('WqtWethSyncEvents', {
      blockNumber: { type: DataType.INTEGER },
      reserve0: { type: DataType.STRING },
      reserve1: { type: DataType.STRING },
      timestamp: { type: DataType.STRING },
      transactionHash: { type: DataType.STRING },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('WqtWethSyncEvents')
  }
};
