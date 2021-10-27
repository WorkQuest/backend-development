'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'device', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'device')
  }
};
