'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('WqtWethBlockInfos', {
      lastParsedBlock: { type: Sequelize.DataTypes.INTEGER, defaultValue: 0 },
      network: { type: Sequelize.DataTypes.STRING, allowNull: false, unique: true }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('WqtWethBlockInfos');
  }
};
