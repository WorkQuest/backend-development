'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ProposalCreatedEvents', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			proposalId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Proposals",
					key: "id"
				}
			},
			network: {
				type: Sequelize.DataTypes.STRING
			},
			transactionHash: {
				type: Sequelize.DataTypes.STRING
			},
			contractProposalId: {
				type: Sequelize.DataTypes.INTEGER
			},
			nonce: {
				type: Sequelize.DataTypes.DECIMAL
			},
			proposer: {
				type: Sequelize.DataTypes.STRING
			},
			description: {
				type: Sequelize.DataTypes.TEXT
			},
			votingPeriod: {
				type: Sequelize.DataTypes.INTEGER
			},
			minimumQuorum: {
				type: Sequelize.DataTypes.INTEGER
			},
			timestamp: {
				type: Sequelize.DataTypes.DECIMAL
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
		return queryInterface.dropTable('ProposalCreatedEvents');
	}
};