'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('QuestMedia', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      mediaId: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model: {
            tableName: 'Media',
            schema: 'public'
          },
          key: 'id'
        }
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model: {
            tableName: 'Quests',
            schema: 'public'
          },
          key: 'id'
        }
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
    return queryInterface.dropTable('QuestMedia');
  }
};
