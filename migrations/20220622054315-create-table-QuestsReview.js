'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('QuestsReviews', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			questId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Quests",
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
			toUserId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
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
		return queryInterface.dropTable('QuestsReviews');
	}
};