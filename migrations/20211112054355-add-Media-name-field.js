'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Media', 'name', {
      type: Sequelize.DataTypes.STRING,
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Media', 'name')
  }
};
