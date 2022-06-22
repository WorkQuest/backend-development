'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Users', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			avatarId: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				references: {
					model: "Media",
					key: "id"
				}
			},
			lastName: {
				type: Sequelize.DataTypes.STRING
			},
			firstName: {
				type: Sequelize.DataTypes.STRING
			},
			email: {
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			role: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null
			},
			additionalInfo: {
				type: Sequelize.DataTypes.JSONB,
				defaultValue: {}
			},
			password: {
				type: Sequelize.DataTypes.STRING
			},
			phone: {
				type: Sequelize.DataTypes.JSONB,
				defaultValue: null
			},
			tempPhone: {
				type: Sequelize.DataTypes.JSONB,
				defaultValue: null
			},
			settings: {
				type: Sequelize.DataTypes.JSONB,
				defaultValue: {
					restorePassword: null,
					emailConfirm: null,
					phoneConfirm: null,
					social: {},
					security: {
						TOTP: {
							confirmCode: null,
							active: false,
							secret: null
						}
					}
				}
			},
			status: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			statusKYC: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			costPerHour: {
				type: Sequelize.DataTypes.DECIMAL,
				defaultValue: null
			},
			payPeriod: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null
			},
			workplace: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null
			},
			priority: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			location: {
				type: Sequelize.DataTypes.JSONB
			},
			locationPlaceName: {
				type: Sequelize.DataTypes.STRING
			},
			locationPostGIS: {
				type: Sequelize.DataTypes.GEOMETRY(POINT, 4326)
			},
			createdAt: {
				type: Sequelize.DataTypes.DATE,
				allowNull: false
			},
			updatedAt: {
				type: Sequelize.DataTypes.DATE,
				allowNull: false
			},
			deletedAt: {
				type: Sequelize.DataTypes.DATE
			}
		});
	},

	async down(queryInterface, Sequelize) {
		return queryInterface.dropTable('Users');
	}
};