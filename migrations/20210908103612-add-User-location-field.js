'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'location', {
      type: Sequelize.DataTypes.JSONB,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'location')
  }
};
