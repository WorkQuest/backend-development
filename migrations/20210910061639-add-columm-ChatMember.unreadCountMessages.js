'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Messages', 'unreadCountMessages', {
      type: Sequelize.DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'unreadCountMessages')
  }
};
