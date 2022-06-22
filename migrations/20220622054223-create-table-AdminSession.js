'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('AdminSessions', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			adminId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Admins",
					key: "id"
				}
			},
			place: {
				type: Sequelize.DataTypes.JSONB,
				defaultValue: {
					country: null,
					city: null
				}
			},
			invalidating: {
				type: Sequelize.DataTypes.BOOLEAN,
				defaultValue: true
			},
			ip: {
				type: Sequelize.DataTypes.STRING
			},
			device: {
				type: Sequelize.DataTypes.STRING
			},
			logoutAt: {
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
		return queryInterface.dropTable('AdminSessions');
	}
};