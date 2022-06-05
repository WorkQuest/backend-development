'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('SupportTicketForUsers', 'decisionDescription', {
      type: Sequelize.DataTypes.TEXT,
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('SupportTicketForUsers', 'decisionDescription');
  }
};
