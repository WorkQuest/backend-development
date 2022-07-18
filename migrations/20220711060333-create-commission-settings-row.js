'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      INSERT INTO "CommissionSettings" ("title", "commission", "createdAt", "updatedAt") 
      VALUES ('CommissionSwapWQT', '{"value": "0", "currency": "%"}', '${new Date().toISOString()}', '${new Date().toISOString()}')
    `);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      DELETE FROM "CommissionSettings" WHERE "title" = 'CommissionSwapWQT'
    `)
  }
};
