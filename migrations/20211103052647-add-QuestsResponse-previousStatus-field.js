'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestsResponses', 'previousStatus', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 0
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestsResponses', 'previousStatus')
  }
};
