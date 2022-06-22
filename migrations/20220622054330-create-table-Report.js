'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('Reports', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      authorId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      resolvedByAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.DataTypes.SMALLINT,
        defaultValue: 0
      },
      number: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true
      },
      entityType: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      resolvedAt: {
        type: Sequelize.DataTypes.DATE
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
    return queryInterface.dropTable('Reports');
  }
};