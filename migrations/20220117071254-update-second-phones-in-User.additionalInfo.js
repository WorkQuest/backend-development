'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.sequelize.query(
      'UPDATE "Users" SET "additionalInfo" = jsonb_set("additionalInfo", \'{secondMobileNumber}\', \'null\') WHERE "additionalInfo" != \'{}\''
    );
  },

  async down (queryInterface, Sequelize) {
  }
};
