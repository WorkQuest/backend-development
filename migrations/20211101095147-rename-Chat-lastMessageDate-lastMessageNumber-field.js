'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Chats', 'lastMessageDate', 'lastMessageNumber');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Chats', 'lastMessageNumber', 'lastMessageDate');
  }
};
