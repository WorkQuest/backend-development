'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('ProposalDelegateChangedEvents', {
      blockNumber: {
        type: Sequelize.DataTypes.INTEGER,
      },
      transactionHash: {
        type: Sequelize.DataTypes.STRING,
      },
      delegator: {
        type: Sequelize.DataTypes.STRING,
      },
      fromDelegate: {
        type: Sequelize.DataTypes.STRING,
      },
      toDelegate: {
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
    return queryInterface.dropTable('ProposalDelegateChangedEvents');
  }
};
