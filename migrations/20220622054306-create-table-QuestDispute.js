'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('QuestDisputes', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Quests',
          key: 'id'
        }
      },
      openDisputeUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      opponentUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      assignedAdminId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        }
      },
      number: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true
      },
      openOnQuestStatus: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      reason: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: 'AnotherReason'
      },
      problemDescription: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      decisionDescription: {
        type: Sequelize.DataTypes.TEXT
      },
      decision: {
        type: Sequelize.DataTypes.STRING
      },
      acceptedAt: {
        type: Sequelize.DataTypes.DATE
      },
      resolvedAt: {
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
    return queryInterface.dropTable('QuestDisputes');
  }
};