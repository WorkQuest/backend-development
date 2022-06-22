'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('RaiseViewsPlatformStatistics', {
			profilesSum: {
				type: Sequelize.DataTypes.DECIMAL,
				defaultValue: "0"
			},
			profilesTotal: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			profilesGoldPlus: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			profilesGold: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			profilesSilver: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			profilesBronze: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			questsSum: {
				type: Sequelize.DataTypes.DECIMAL,
				defaultValue: "0"
			},
			questsTotal: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			questsGoldPlus: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			questsGold: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			questsSilver: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			questsBronze: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			date: {
				type: Sequelize.DataTypes.DATE,
				defaultValue: 1655895098040,
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
		return queryInterface.dropTable('RaiseViewsPlatformStatistics');
	}
};