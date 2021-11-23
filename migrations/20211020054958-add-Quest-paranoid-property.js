'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Quests', 'deletedAt', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Quests', 'deletedAt')
  }
};
