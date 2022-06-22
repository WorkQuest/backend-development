'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('SupportTicketForUsers', {
			id: {
				type: Sequelize.DataTypes.STRING,
				primaryKey: true
			},
			number: {
				type: Sequelize.DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: false
			},
			authorUserId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				}
			},
			resolvedByAdminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "Admins",
					key: "id"
				}
			},
			replyToMail: {
				type: Sequelize.DataTypes.STRING
			},
			title: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			description: {
				type: Sequelize.DataTypes.TEXT,
				allowNull: false
			},
			status: {
				type: Sequelize.DataTypes.SMALLINT,
				allowNull: false
			},
			decisionPostedIn: {
				type: Sequelize.DataTypes.STRING
			},
			decisionDescription: {
				type: Sequelize.DataTypes.TEXT
			},
			takenAt: {
				type: Sequelize.DataTypes.DATE
			},
			decidedAt: {
				type: Sequelize.DataTypes.DATE
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
		return queryInterface.dropTable('SupportTicketForUsers');
	}
};