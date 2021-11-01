'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chats', 'lastMessageDate')
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chats', 'lastMessageDate', {
      type: Sequelize.DataTypes.DATE,
      defaultValue: null,
    });
  }
};
