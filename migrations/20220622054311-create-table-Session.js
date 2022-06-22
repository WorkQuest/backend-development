'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Sessions', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			userId: {
				type: Sequelize.DataTypes.STRING,
				references: {
					model: "Users",
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
			app: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: "App"
			},
			invalidating: {
				type: Sequelize.DataTypes.BOOLEAN,
				defaultValue: true
			},
			isTotpPassed: {
				type: Sequelize.DataTypes.BOOLEAN,
				allowNull: false
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
		return queryInterface.dropTable('Sessions');
	}
};