'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('IndustryFilters', {
      key: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.DataTypes.INTEGER
      },
      industry: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('IndustryFilters');
  }
};