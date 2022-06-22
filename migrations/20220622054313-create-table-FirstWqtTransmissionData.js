'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('FirstWqtTransmissionData', {
			id: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			transactionHashTransmissionWqt: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Transactions",
					key: "hash"
				}
			},
			txHashSwapInitialized: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "BridgeSwapUsdtTokenEvents",
					key: "transactionHash"
				}
			},
			gasPriceAtMoment: {
				type: Sequelize.DataTypes.INTEGER
			},
			amount: {
				type: Sequelize.DataTypes.DECIMAL
			},
			platformCommissionCoefficient: {
				type: Sequelize.DataTypes.DOUBLE PRECISION
			},
			status: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false
			},
			error: {
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
		return queryInterface.dropTable('FirstWqtTransmissionData');
	}
};