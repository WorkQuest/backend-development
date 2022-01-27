'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: '',
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'locationPlaceName')
  }
};
