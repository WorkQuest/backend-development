'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'phone')
  }
};
