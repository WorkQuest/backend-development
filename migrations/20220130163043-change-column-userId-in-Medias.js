'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Media', 'userId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      references: {
        model: {
          tableName: 'Users',
          schema: 'public',
        },
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Medias', 'userId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      references: {
        model: {
          tableName: 'Users',
          schema: 'public',
        },
        key: 'id'
      }
    })
  },
};
