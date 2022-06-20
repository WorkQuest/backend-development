'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('Users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('Users');
  }
};
