'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'chatId', {
      type: Sequelize.DataTypes.string,
      defaultValue: null
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'chatId')
  }
};
