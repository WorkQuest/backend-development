'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChatMembers', 'lastReadMessageDate', {
      type: Sequelize.DataTypes.DATE,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChatMembers', 'lastReadMessageDate')
  }
};
