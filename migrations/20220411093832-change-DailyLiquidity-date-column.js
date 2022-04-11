'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('DailyLiquidities', 'date', {
      type: Sequelize.DataTypes.STRING,
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('DailyLiquidities', 'date', {
      type: Sequelize.DataTypes.DECIMAL,
    });
  },
};
