'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('SupportTicketForUsers', 'takenAt', {
      type: Sequelize.DataTypes.DATE,
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('SupportTicketForUsers', 'takenAt');
  }
};
