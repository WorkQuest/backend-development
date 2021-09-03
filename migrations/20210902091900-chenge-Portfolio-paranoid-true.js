'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Portfolios', 'deletedAt', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Portfolios', 'deletedAt')
  }
};
