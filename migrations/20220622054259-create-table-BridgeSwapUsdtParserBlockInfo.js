'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('BridgeSwapUsdtParserBlockInfos', {
      lastParsedBlock: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      network: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
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
    return queryInterface.dropTable('BridgeSwapUsdtParserBlockInfos');
  }
};