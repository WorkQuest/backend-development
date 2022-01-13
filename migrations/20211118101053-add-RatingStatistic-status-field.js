'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('RatingStatistics', 'status', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: "noStatus",
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('RatingStatistics', 'status')
  }
};
