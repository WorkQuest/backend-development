'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'wagePerHour', 'costPerHour');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'costPerHour', 'wagePerHour');
  }
};
