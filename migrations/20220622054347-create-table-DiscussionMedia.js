'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('DiscussionMedia', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      mediaId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
          model: 'Media',
          key: 'id'
        }
      },
      discussionId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
          model: 'Discussions',
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
    return queryInterface.dropTable('DiscussionMedia');
  }
};