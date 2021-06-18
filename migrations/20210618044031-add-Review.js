'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Reviews', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Quests',
            schema: 'public'
          },
          key: 'id'
        }
      },
      fromUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
      toUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public'
          },
          key: 'id'
        }
      },
      message: {
        type: Sequelize.DataTypes.TEXT,
        defaultValue: null,
      },
      mark: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Reviews');
  }
};
