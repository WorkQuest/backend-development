'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Portfolios', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			userId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				}
			},
			title: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			description: {
				type: Sequelize.DataTypes.TEXT
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
		return queryInterface.dropTable('Portfolios');
	}
};