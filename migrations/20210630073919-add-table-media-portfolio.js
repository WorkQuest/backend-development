'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('PortfolioMedia', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      mediaId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Media',
            schema: 'public'
          },
          key: 'id'
        }
      },
      portfolioId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: {
            tableName: 'Portfolios',
            schema: 'public'
          },
          key: 'id'
        }
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
    return queryInterface.dropTable('PortfolioMedia');
  }
};


