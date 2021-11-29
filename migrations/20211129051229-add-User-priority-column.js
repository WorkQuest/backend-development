'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'priority', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 0
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'priority')
  }
};
