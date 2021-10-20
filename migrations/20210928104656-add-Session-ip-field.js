'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'ip', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: null,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'ip')
  }
};
