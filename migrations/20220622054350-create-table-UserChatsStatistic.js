'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('UserChatsStatistics', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			userId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Users",
					key: "id"
				}
			},
			unreadCountChats: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
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
		return queryInterface.dropTable('UserChatsStatistics');
	}
};