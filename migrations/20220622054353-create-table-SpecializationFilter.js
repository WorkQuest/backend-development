'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('SpecializationFilters', {
      key: {
        primaryKey: true,
        type: Sequelize.DataTypes.INTEGER
      },
      industryKey: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'IndustryFilters',
          key: 'key'
        }
      },
      specialization: {
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
    return queryInterface.dropTable('SpecializationFilters');
  }
};