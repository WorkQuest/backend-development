'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Quests', 'employment', 'typeOfEmployment');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Quests', 'typeOfEmployment', 'employment');
  }
};
