'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('Quests', {
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
      avatarId: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
        allowNull: true
      },
      assignedWorkerId: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      contractAddress: {
        type: Sequelize.DataTypes.STRING
      },
      nonce: {
        type: Sequelize.DataTypes.DECIMAL,
        unique: true
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      price: {
        type: Sequelize.DataTypes.DECIMAL,
        allowNull: false
      },
      payPeriod: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      workplace: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      typeOfEmployment: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      priority: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      location: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: false
      },
      locationPlaceName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      locationPostGIS: {
        type: Sequelize.DataTypes.GEOMETRY('POINT', 4326)
      },
      startedAt: {
        type: Sequelize.DataTypes.DATE
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
    return queryInterface.dropTable('Quests');
  }
};