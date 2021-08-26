'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chats', 'name', {
      type: Sequelize.DataTypes.STRING, defaultValue: null
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chats', 'name')
  }
};
