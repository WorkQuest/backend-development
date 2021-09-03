'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Quests', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Quests', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
    });
  }
};
