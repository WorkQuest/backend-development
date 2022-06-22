'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('InfoMessages', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			messageId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Messages",
					key: "id"
				}
			},
			memberId: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				references: {
					model: "ChatMembers",
					key: "id"
				}
			},
			messageAction: {
				type: Sequelize.DataTypes.STRING,
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
		return queryInterface.dropTable('InfoMessages');
	}
};