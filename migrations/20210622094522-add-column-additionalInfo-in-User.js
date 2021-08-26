'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'additionalInfo', {
      type: Sequelize.DataTypes.JSONB,
      defaultValue: {}
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'additionalInfo')
  }
};
