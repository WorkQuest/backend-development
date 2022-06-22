'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Transactions', {
			hash: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			from: {
				type: Sequelize.DataTypes.STRING
			},
			to: {
				type: Sequelize.DataTypes.STRING
			},
			blockNumber: {
				type: Sequelize.DataTypes.INTEGER
			},
			status: {
				type: Sequelize.DataTypes.INTEGER
			},
			amount: {
				type: Sequelize.DataTypes.DECIMAL
			},
			gasUsed: {
				type: Sequelize.DataTypes.DECIMAL
			},
			error: {
				type: Sequelize.DataTypes.STRING
			},
			network: {
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
		return queryInterface.dropTable('Transactions');
	}
};