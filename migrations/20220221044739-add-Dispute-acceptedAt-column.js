'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestDisputes', 'acceptedAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestDisputes', 'acceptedAt')
  }
};
