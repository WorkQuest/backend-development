'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ChatMembers', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING,
        unique: true
      },
      chatId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Chats',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      adminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      status: {
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
    return queryInterface.dropTable('ChatMembers');
  }
};