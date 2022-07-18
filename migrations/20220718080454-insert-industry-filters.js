'use strict';

const insertIndustryFiltersSQL = require('../raw-queries/migrations/insertIndustryFilters.sql');

module.exports = {
  async up (queryInterface, Sequelize, transaction) {
    return queryInterface.sequelize.query(insertIndustryFiltersSQL, { transaction });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('DELETE * FROM "IndustryFilters" WHERE "key" IS NOT NULL');
  }
};
