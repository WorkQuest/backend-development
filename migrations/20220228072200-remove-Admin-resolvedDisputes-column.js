'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Admins', 'resolvedDisputes')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Admins', 'resolvedDisputes', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 0,
    })
  }
};