'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestsStatistics', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      completed: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      opened: {
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
    return queryInterface.dropTable('QuestsStatistics');
  }
};