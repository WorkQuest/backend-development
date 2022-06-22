'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Admins', {
			id: {
				type: Sequelize.DataTypes.STRING,
				primaryKey: true
			},
			email: {
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			password: {
				type: Sequelize.DataTypes.STRING
			},
			firstName: {
				type: Sequelize.DataTypes.STRING
			},
			lastName: {
				type: Sequelize.DataTypes.STRING
			},
			role: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			settings: {
				type: Sequelize.DataTypes.JSONB,
				allowNull: false
			},
			isActive: {
				type: Sequelize.DataTypes.BOOLEAN,
				defaultValue: false
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
		return queryInterface.dropTable('Admins');
	}
};