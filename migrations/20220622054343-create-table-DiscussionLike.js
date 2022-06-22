'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('DiscussionLikes', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			discussionId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Discussions",
					key: "id"
				},
				unique: true
			},
			userId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				},
				unique: true
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
		return queryInterface.dropTable('DiscussionLikes');
	}
};