'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('ReferralProgramReferrals', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			referralUserId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				}
			},
			affiliateId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "ReferralProgramAffiliates",
					key: "id"
				}
			},
			referralStatus: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: "registered"
			},
			rewardStatus: {
				type: Sequelize.DataTypes.STRING,
				defaultValue: null
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
		return queryInterface.dropTable('ReferralProgramReferrals');
	}
};