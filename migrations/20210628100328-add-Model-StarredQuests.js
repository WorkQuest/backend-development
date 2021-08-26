'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('StarredQuests', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
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
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('StarredQuests');
  }
};
