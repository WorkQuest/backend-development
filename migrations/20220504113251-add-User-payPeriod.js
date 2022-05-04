'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'payPeriod', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'payPeriod')
  }
};
