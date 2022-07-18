'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('CREATE EXTENSION postgis');
  },

  async down (queryInterface, Sequelize) {

  }
};
