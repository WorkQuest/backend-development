'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('UsersPlatformStatistics', {
			registered: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			finished: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			unfinished: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			workers: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			employers: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			linkedin: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			twitter: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			facebook: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			google: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			smsPassed: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			smsNotPassed: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			kycPassed: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			kycNotPassed: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			useWeb: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			useApp: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			useWallet: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			noStatus: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			verified: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			reliable: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			topRanked: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			averageSessionTime: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			use2FA: {
				type: Sequelize.DataTypes.INTEGER,
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
		return queryInterface.dropTable('UsersPlatformStatistics');
	}
};