'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'logoutAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'logoutAt')
  }
};
