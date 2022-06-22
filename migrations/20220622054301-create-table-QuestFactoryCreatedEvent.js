'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('QuestFactoryCreatedEvents', {
			id: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			nonce: {
				type: Sequelize.DataTypes.DECIMAL
			},
			jobHash: {
				type: Sequelize.DataTypes.STRING
			},
			employerAddress: {
				type: Sequelize.DataTypes.STRING
			},
			contractAddress: {
				type: Sequelize.DataTypes.STRING
			},
			timestamp: {
				type: Sequelize.DataTypes.STRING
			},
			transactionHash: {
				type: Sequelize.DataTypes.STRING
			},
			network: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			status: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false
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
		return queryInterface.dropTable('QuestFactoryCreatedEvents');
	}
};