'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('StarredMessages', {
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
			messageId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Messages",
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
		return queryInterface.dropTable('StarredMessages');
	}
};