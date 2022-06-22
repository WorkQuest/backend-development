'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Messages', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			number: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false
			},
			chatId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Chats",
					key: "id"
				}
			},
			senderMemberId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "ChatMembers",
					key: "id"
				}
			},
			senderStatus: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: "Unread"
			},
			type: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			text: {
				type: Sequelize.DataTypes.TEXT
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
		return queryInterface.dropTable('Messages');
	}
};