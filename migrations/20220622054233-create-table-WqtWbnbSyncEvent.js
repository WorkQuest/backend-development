'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('WqtWbnbSyncEvents', {
			id: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			blockNumber: {
				type: Sequelize.DataTypes.INTEGER
			},
			reserve0: {
				type: Sequelize.DataTypes.STRING
			},
			reserve1: {
				type: Sequelize.DataTypes.STRING
			},
			timestamp: {
				type: Sequelize.DataTypes.STRING
			},
			transactionHash: {
				type: Sequelize.DataTypes.STRING
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
		return queryInterface.dropTable('WqtWbnbSyncEvents');
	}
};