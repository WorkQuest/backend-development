'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ChatMemberData', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING,
        unique: true
      },
      chatMemberId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'ChatMembers',
          key: 'id'
        }
      },
      lastReadMessageId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id'
        }
      },
      unreadCountMessages: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      lastReadMessageNumber: {
        type: Sequelize.DataTypes.INTEGER
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
    return queryInterface.dropTable('ChatMemberData');
  }
};