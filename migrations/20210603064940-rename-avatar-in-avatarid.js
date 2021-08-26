'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'avatar', 'avatarId');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'avatarId', 'avatar');
  }
};
