'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Chats', 'creatorUserId', 'ownerUserId', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Chats', 'ownerUserId', 'creatorUserId', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    });
  }
};
