'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('Discussions', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      authorId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
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
      amountLikes: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      amountComments: {
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
      },
      deletedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('Discussions');
  }
};