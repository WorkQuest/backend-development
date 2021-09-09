'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('SkillFilters', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
        references: {
          model: {
            tableName: 'Quests',
            schema: 'public'
          },
          key: 'id'
        }
      },
      category: { type: Sequelize.DataTypes.STRING, allowNull: false },
      skill: { type: Sequelize.DataTypes.STRING, allowNull: false },
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SkillFilters');
  }
};
