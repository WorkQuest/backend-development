'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('BridgeSwapTokenEvents', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      transactionHash: {
        type: Sequelize.DataTypes.STRING
      },
      blockNumber: {
        type: Sequelize.DataTypes.INTEGER
      },
      network: {
        type: Sequelize.DataTypes.STRING
      },
      event: {
        type: Sequelize.DataTypes.STRING
      },
      messageHash: {
        type: Sequelize.DataTypes.STRING
      },
      nonce: {
        type: Sequelize.DataTypes.INTEGER
      },
      timestamp: {
        type: Sequelize.DataTypes.STRING
      },
      initiator: {
        type: Sequelize.DataTypes.STRING
      },
      recipient: {
        type: Sequelize.DataTypes.STRING
      },
      amount: {
        type: Sequelize.DataTypes.DECIMAL
      },
      chainTo: {
        type: Sequelize.DataTypes.INTEGER
      },
      chainFrom: {
        type: Sequelize.DataTypes.INTEGER
      },
      symbol: {
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
    return queryInterface.dropTable('BridgeSwapTokenEvents');
  }
};