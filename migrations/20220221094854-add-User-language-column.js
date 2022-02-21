'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'language', {
      type: Sequelize.DataTypes.STRING,
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'language')
  }
};
