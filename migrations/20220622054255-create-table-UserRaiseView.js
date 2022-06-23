'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('UserRaiseViews', {
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
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 1
      },
      duration: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: null
      },
      type: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: null
      },
      endedAt: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: null
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
    return queryInterface.dropTable('UserRaiseViews');
  }
};