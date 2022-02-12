'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('Sessions', 'isTotpPassed', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Sessions', 'isTotpPassed')
  }
};
