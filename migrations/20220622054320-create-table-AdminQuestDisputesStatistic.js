'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('AdminQuestDisputesStatistics', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			adminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Admins",
					key: "id"
				}
			},
			reviewCount: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			averageMark: {
				type: Sequelize.DataTypes.DOUBLE PRECISION,
				defaultValue: null
			},
			resolvedQuestDisputes: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			averageResolutionTimeInSeconds: {
				type: Sequelize.DataTypes.DOUBLE PRECISION,
				defaultValue: null
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
		return queryInterface.dropTable('AdminQuestDisputesStatistics');
	}
};