'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SkillFilters');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('SkillFilters', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      }
    });
  }
};
