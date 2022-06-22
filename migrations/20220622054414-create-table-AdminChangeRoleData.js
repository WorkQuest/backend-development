'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('AdminChangeRoleData', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      changedByAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      adminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      movedFromRole: {
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
    return queryInterface.dropTable('AdminChangeRoleData');
  }
};