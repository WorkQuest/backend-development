'use strict';

const insertSpecializationFiltersSQL = require('../raw-queries/migrations/insertSpecializationFilters.sql');

module.exports = {
  async up (queryInterface, Sequelize, transaction) {
    return queryInterface.sequelize.query(insertSpecializationFiltersSQL, { transaction });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('DELETE * FROM "SpecializationFilters" WHERE "key" IS NOT NULL');
  }
};
