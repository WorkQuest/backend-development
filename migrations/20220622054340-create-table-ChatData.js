'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ChatData', {
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
			lastMessageId: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null,
				allowNull: true
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
		return queryInterface.dropTable('ChatData');
	}
};