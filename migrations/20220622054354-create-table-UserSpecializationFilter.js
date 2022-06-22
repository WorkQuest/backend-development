'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('UserSpecializationFilters', {
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
			industryKey: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "IndustryFilters",
					key: "key"
				}
			},
			specializationKey: {
				type: Sequelize.DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: "SpecializationFilters",
					key: "key"
				}
			},
			path: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
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
		return queryInterface.dropTable('UserSpecializationFilters');
	}
};