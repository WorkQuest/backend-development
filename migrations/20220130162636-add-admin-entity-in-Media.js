'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Media', 'adminId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      references: {
        model: {
          tableName: 'Admins',
          schema: 'public',
        },
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Medias', 'adminId')
  }
};
