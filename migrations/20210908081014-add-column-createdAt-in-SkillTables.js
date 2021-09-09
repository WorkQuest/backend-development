'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('SkillFilters', 'createdAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('SkillFilters', 'createdAt')
  }
};
