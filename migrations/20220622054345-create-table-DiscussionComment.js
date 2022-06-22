'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('DiscussionComments', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING
			},
			authorId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Users",
					key: "id"
				}
			},
			discussionId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false,
				references: {
					model: "Discussions",
					key: "id"
				}
			},
			rootCommentId: {
				type: Sequelize.DataTypes.STRING,
				allowNull: true,
				references: {
					model: "DiscussionComments",
					key: "id"
				}
			},
			text: {
				type: Sequelize.DataTypes.TEXT,
				allowNull: false
			},
			amountLikes: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			amountSubComments: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			level: {
				type: Sequelize.DataTypes.INTEGER,
				defaultValue: 0
			},
			status: {
				type: Sequelize.DataTypes.SMALLINT,
				defaultValue: 0
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
		return queryInterface.dropTable('DiscussionComments');
	}
};