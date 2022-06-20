'use strict';

module.exports = {
  async up (queryInterface, Sequelize, transaction) {
    return queryInterface.createTable('Sessions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        references: { model: 'Users', key: 'id' }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('Sessions');
  }
};
