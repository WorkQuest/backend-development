'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'place', {
      type: Sequelize.DataTypes.JSONB,
      defaultValue: { country: null, city: null },
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'place')
  }
};
