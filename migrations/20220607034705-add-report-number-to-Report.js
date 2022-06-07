'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('Reports', 'number', {
      type: Sequelize.DataTypes.INTEGER,
      autoIncrement: true
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Reports', 'number');
  }
};
