'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('UserChangeRoleData', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      changedAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      movedFromRole: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      additionalInfo: {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {}
      },
      costPerHour: {
        type: Sequelize.DataTypes.DECIMAL,
        defaultValue: null
      },
      workplace: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null
      },
      priority: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
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
    return queryInterface.dropTable('UserChangeRoleData');
  }
};