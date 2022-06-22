'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('WorkerProfileVisibilitySettings', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      ratingStatusCanInviteMeOnQuest: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 15
      },
      ratingStatusInMySearch: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 15
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
    return queryInterface.dropTable('WorkerProfileVisibilitySettings');
  }
};