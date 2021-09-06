'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Messages', 'type', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'type')
  }
};
