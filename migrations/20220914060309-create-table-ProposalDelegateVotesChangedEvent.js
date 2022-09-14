'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('ProposalDelegateVotesChangedEvents', {
      blockNumber: {
        type: Sequelize.DataTypes.INTEGER,
      },
      transactionHash: {
        type: Sequelize.DataTypes.STRING,
      },
      delegator: {
        type: Sequelize.DataTypes.STRING,
      },
      delegatee: {
        type: Sequelize.DataTypes.STRING,
      },
      previousBalance: {
        type: Sequelize.DataTypes.DECIMAL,
      },
      newBalance: {
        type: Sequelize.DataTypes.DECIMAl,
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
    return queryInterface.dropTable('ProposalDelegateVotesChangedEvents');
  }
};
