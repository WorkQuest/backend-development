'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('PortfolioMedia', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			mediaId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				unique: true,
				references: {
					model: "Media",
					key: "id"
				}
			},
			portfolioId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				unique: true,
				references: {
					model: "Portfolios",
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
		return queryInterface.dropTable('PortfolioMedia');
	}
};