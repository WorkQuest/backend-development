'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('UserChangeRoleData', 'wagePerHour', 'costPerHour');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('UserChangeRoleData', 'costPerHour', 'wagePerHour');
  }
};
