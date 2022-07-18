'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('DiscussionCommentLikes', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      commentId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'DiscussionComments',
          key: 'id'
        },
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
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
    return queryInterface.dropTable('DiscussionCommentLikes');
  }
};