'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('DaoPlatformStatistics', {
			votes: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			delegatedValue: {
				type: Sequelize.DataTypes.DECIMAL,
				defaultValue: "0"
			},
			votesFor: {
				type: Sequelize.DataTypes.FLOAT,
				defaultValue: 0
			},
			votesAgain: {
				type: Sequelize.DataTypes.FLOAT,
				defaultValue: 0
			},
			date: {
				type: Sequelize.DataTypes.DATE,
				defaultValue: 1655895098041,
				primaryKey: true
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
		return queryInterface.dropTable('DaoPlatformStatistics');
	}
};