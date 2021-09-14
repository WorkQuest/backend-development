'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('InfoMessages', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      messageId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Messages',
            schema: 'public'
          },
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
      messageAction: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('InfoMessages');
  }
};
