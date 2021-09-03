'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: '',
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'locationPlaceName')
  }
};
