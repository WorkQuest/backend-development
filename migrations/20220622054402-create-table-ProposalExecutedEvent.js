'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ProposalExecutedEvents', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      proposalId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Proposals',
          key: 'id'
        }
      },
      network: {
        type: Sequelize.DataTypes.STRING
      },
      timestamp: {
        type: Sequelize.DataTypes.DECIMAL
      },
      transactionHash: {
        type: Sequelize.DataTypes.STRING
      },
      contractProposalId: {
        type: Sequelize.DataTypes.INTEGER
      },
      succeeded: {
        type: Sequelize.DataTypes.BOOLEAN
      },
      defeated: {
        type: Sequelize.DataTypes.BOOLEAN
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('ProposalExecutedEvents');
  }
};