'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('GroupChats', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			name: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null
			},
			ownerMemberId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "ChatMembers",
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
		return queryInterface.dropTable('GroupChats');
	}
};