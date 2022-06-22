'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('QuestDisputeReviews', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			disputeId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "QuestDisputes",
					key: "id"
				}
			},
			fromUserId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				}
			},
			toAdminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Admins",
					key: "id"
				}
			},
			message: {
				type: Sequelize.DataTypes.TEXT,
				defaultValue: null
			},
			mark: {
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
		return queryInterface.dropTable('QuestDisputeReviews');
	}
};