'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('CommissionSettings', {
      title: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      commission: {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {}
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
    return queryInterface.dropTable('CommissionSettings');
  }
};