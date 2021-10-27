'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ParserInfos');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('ParserInfos', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      }
    });
  }
};
