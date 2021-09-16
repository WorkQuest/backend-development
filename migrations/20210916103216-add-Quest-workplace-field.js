'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'workplace', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: 'distant',
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'workplace')
  }
};
