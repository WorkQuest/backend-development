'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('StarredChats', {
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
			adminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Admins",
					key: "id"
				}
			},
			chatId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Chats",
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
		return queryInterface.dropTable('StarredChats');
	}
};