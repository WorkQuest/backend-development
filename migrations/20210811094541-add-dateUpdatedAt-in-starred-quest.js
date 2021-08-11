'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('StarredQuests', 'updatedAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('StarredQuests', 'updatedAt')
  }
};
