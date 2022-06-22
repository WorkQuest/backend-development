'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('StarredDiscussions', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			userId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
			},
			discussionId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Discussions",
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
		return queryInterface.dropTable('StarredDiscussions');
	}
};