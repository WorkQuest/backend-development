'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('QuestMedia', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			mediaId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				unique: true,
				references: {
					model: "Media",
					key: "id"
				}
			},
			questId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				unique: true,
				references: {
					model: "Quests",
					key: "id"
				}
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
		return queryInterface.dropTable('QuestMedia');
	}
};