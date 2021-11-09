'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('QuestChats', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Quests',
            schema: 'public'
          },
          key: 'id'
        }
      },
      responseId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'QuestsResponses',
            schema: 'public'
          },
          key: 'id'
        }
      },
      chatId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Chats',
            schema: 'public'
          },
          key: 'id'
        }
      },
      isActive: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('QuestChats');
  }
};
