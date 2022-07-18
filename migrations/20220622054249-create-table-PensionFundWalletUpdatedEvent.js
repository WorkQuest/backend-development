'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('PensionFundWalletUpdatedEvents', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      blockNumber: {
        type: Sequelize.DataTypes.INTEGER
      },
      transactionHash: {
        type: Sequelize.DataTypes.STRING
      },
      user: {
        type: Sequelize.DataTypes.STRING
      },
      newFee: {
        type: Sequelize.DataTypes.STRING
      },
      unlockDate: {
        type: Sequelize.DataTypes.STRING
      },
      timestamp: {
        type: Sequelize.DataTypes.STRING
      },
      event: {
        type: Sequelize.DataTypes.STRING
      },
      network: {
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
    return queryInterface.dropTable('PensionFundWalletUpdatedEvents');
  }
};