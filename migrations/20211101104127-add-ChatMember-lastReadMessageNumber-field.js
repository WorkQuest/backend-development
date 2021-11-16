'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChatMembers', 'lastReadMessageNumber', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: null
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChatMembers', 'lastReadMessageNumber')
  }
};
