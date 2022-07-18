'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestChats', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING,
        unique: true
      },
      employerId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      workerId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      disputeAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Quests',
          key: 'id'
        }
      },
      responseId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'QuestsResponses',
          key: 'id'
        }
      },
      chatId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Chats',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
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
    return queryInterface.dropTable('QuestChats');
  }
};