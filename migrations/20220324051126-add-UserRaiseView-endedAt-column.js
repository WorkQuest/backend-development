'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('UserRaiseViews', 'endedAt', {
      type: Sequelize.DataTypes.DATE,
      defaultValue: null
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('UserRaiseViews', 'endedAt')
  }
};
