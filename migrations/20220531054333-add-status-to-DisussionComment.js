'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('DiscussionComments', 'status', {
      type: Sequelize.DataTypes.SMALLINT,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DiscussionComments', 'status');
  }
};
