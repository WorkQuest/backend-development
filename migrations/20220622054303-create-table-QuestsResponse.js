'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestsResponses', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      workerId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Quests',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      message: {
        type: Sequelize.DataTypes.TEXT
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
    return queryInterface.dropTable('QuestsResponses');
  }
};