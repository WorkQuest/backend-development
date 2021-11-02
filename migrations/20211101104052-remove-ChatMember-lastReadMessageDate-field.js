'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChatMembers', 'lastReadMessageDate')
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChatMembers', 'lastReadMessageDate', {
      type: Sequelize.DataTypes.DATE,
      defaultValue: null,
    });
  }
};
