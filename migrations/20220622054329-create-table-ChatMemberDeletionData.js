'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ChatMemberDeletionData', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
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
			reason: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
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
		return queryInterface.dropTable('ChatMemberDeletionData');
	}
};