'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'number')
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Messages', 'number', {
      type: Sequelize.DataTypes.INTEGER,
      autoIncrement: true,
    })
  }
};
