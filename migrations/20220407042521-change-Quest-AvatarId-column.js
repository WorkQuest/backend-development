'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Quests', 'avatarId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      references: {
        model: {
          tableName: 'Media',
          schema: 'public',
        },
        key: 'id'
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'avatarId', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    });
  },
};
