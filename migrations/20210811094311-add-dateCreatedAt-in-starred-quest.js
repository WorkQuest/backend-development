'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('StarredQuests', 'createdAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('StarredQuests', 'createdAt')
  }
};
