'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('AdminActionMetadata', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      adminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      path: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      HTTPVerb: {
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
    return queryInterface.dropTable('AdminActionMetadata');
  }
};