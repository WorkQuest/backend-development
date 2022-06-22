'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('QuestSpecializationFilters', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			questId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Quests",
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
		return queryInterface.dropTable('QuestSpecializationFilters');
	}
};