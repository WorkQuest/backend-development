'use strict';

const path = require('path');
const fs = require('fs');

const insertIndustryFiltersPath = path.join(__dirname, '..', 'raw-queries', 'migrations', 'insertIndustryFilters.sql');
const insertIndustryFiltersQuery = fs.readFileSync(insertIndustryFiltersPath).toString();

module.exports = {
  async up (queryInterface, Sequelize, transaction) {
    return queryInterface.sequelize.query(insertIndustryFiltersQuery, { transaction });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('DELETE * FROM "IndustryFilters" WHERE "key" IS NOT NULL');
  }
};
