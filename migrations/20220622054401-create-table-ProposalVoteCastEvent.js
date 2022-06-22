'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ProposalVoteCastEvents', {
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
			voter: {
				type: Sequelize.DataTypes.STRING
			},
			contractProposalId: {
				type: Sequelize.DataTypes.INTEGER
			},
			support: {
				type: Sequelize.DataTypes.BOOLEAN
			},
			votes: {
				type: Sequelize.DataTypes.DECIMAL
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
		return queryInterface.dropTable('ProposalVoteCastEvents');
	}
};