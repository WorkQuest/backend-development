'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Messages', 'senderStatus', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: "unread"
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Messages', 'senderStatus')
  }
};
