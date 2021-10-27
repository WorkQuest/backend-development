'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'locationPostGIS', {
      type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'locationPostGIS')
  }
};
