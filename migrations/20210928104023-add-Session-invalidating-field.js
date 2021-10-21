'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'invalidating', {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'invalidating')
  }
};
