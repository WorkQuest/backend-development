'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('WqtWethMintEvents', {
      blockNumber: { type: Sequelize.DataTypes.INTEGER },
      amount0: { type: Sequelize.DataTypes.STRING },
      amount1: { type: Sequelize.DataTypes.STRING },
      sender: { type: Sequelize.DataTypes.STRING },
      timestamp: { type: Sequelize.DataTypes.STRING },
      transactionHash: { type: Sequelize.DataTypes.STRING },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('WqtWethMintEvents');
  }
};
