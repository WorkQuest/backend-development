'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('Media', {
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
      adminId: {
        type: Sequelize.DataTypes.STRING
      },
      contentType: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      url: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      hash: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
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
    return queryInterface.dropTable('Media');
  }
};