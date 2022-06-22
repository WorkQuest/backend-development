'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('AdminChatStatistics', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			adminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Admins",
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
		return queryInterface.dropTable('AdminChatStatistics');
	}
};