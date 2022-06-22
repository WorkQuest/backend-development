'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('Proposals', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      proposerUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      discussionId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Discussions',
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
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      nonce: {
        unique: true,
        allowNull: false,
        type: Sequelize.DataTypes.DECIMAL
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
    return queryInterface.dropTable('Proposals');
  }
};