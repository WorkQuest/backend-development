'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ChatDeletionData', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			chatId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Chats",
					key: "id"
				}
			},
			chatMemberId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "ChatMembers",
					key: "id"
				}
			},
			beforeDeletionMessageId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Messages",
					key: "id"
				}
			},
			beforeDeletionMessageNumber: {
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
		return queryInterface.dropTable('ChatDeletionData');
	}
};