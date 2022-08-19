'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (tx) => {
      await queryInterface.addColumn('Users', 'metadata', {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: { state: { neverEditedProfileFlag: true } },
      }, { transaction: tx });

      await queryInterface.sequelize.query(`
        UPDATE "Users" SET "metadata" = jsonb_set("metadata"::jsonb, '{state,neverEditedProfileFlag}', 'false'::jsonb, true)
               WHERE "status" IN (0, 2)
      `, { transaction: tx });
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'metadata');
  }
};
