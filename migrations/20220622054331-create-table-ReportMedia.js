'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ReportMedia', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      mediaId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
          model: 'Media',
          key: 'id'
        }
      },
      reportId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
          model: 'Reports',
          key: 'id'
        }
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
    return queryInterface.dropTable('ReportMedia');
  }
};