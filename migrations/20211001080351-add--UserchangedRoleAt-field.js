'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'changedRoleAt', {
      type: Sequelize.DataTypes.DATE,
      defaultValue: null,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'changedRoleAt')
  }
};
