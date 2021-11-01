'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ChatMembers', 'lastReadMessageDate', 'lastReadMessageNumber');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('ChatMembers', 'lastReadMessageNumber', 'lastReadMessageDate');
  }
};
