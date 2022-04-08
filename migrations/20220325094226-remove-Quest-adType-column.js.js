'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'adType')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'adType', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: null,
    })
  }
};
