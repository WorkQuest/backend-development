'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'payPeriod', {
      type: Sequelize.DataTypes.STRING,
      // allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'payPeriod')
  }
};
