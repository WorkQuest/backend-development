'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SwapData');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('SwapData', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      }
    });
  }
};
