'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chats', 'lastMessageNumber', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: null
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chats', 'lastMessageNumber')
  }
};
