'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('SupportTicketForUsers', 'completionAt', 'decidedAt');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('SupportTicketForUsers', 'decidedAt', 'completionAt');
  }
};
