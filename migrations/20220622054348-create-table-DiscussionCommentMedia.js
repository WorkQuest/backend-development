'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('DiscussionCommentMedia', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      mediaId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Media',
          key: 'id'
        }
      },
      commentId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'DiscussionComments',
          key: 'id'
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
    return queryInterface.dropTable('DiscussionCommentMedia');
  }
};