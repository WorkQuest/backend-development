'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Users', 'avatarId', {
      type: Sequelize.DataTypes.STRING,
      references: {
        model: {
          tableName: 'Media',
          schema: 'public'
        },
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Users', 'avatarId', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    });
  }
};
