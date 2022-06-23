'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('UserBlackLists', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      blockedByAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      unblockedByAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      reason: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      userStatusBeforeBlocking: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      unblockedAt: {
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
    return queryInterface.dropTable('UserBlackLists');
  }
};