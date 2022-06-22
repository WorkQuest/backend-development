'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('RaiseViewPromotedUserEvents', {
			id: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			blockNumber: {
				type: Sequelize.DataTypes.INTEGER
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
			user: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			tariff: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false
			},
			period: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			promotedAt: {
				type: Sequelize.DataTypes.STRING,
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
		return queryInterface.dropTable('RaiseViewPromotedUserEvents');
	}
};