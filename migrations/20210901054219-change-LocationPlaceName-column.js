'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Quests', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Quests', 'locationPlaceName', {
      type: Sequelize.DataTypes.STRING,
    });
  }
};
