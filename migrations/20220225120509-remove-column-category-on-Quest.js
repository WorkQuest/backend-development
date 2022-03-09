'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'category')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'category', {
      type: Sequelize.DataTypes.STRING
    });
  }
};
