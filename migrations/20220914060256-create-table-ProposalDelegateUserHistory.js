'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('ProposalDelegateUserHistories', {
      delegator: {
        type: Sequelize.DataTypes.STRING,
      },
      delegatee: {
        type: Sequelize.DataTypes.STRING,
      },
      timestamp: {
        type: Sequelize.DataTypes.STRING,
      },
      network: {
        type: Sequelize.DataTypes.STRING,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('ProposalDelegateUserHistories');
  }
};
