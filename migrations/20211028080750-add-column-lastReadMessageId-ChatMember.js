'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ChatMembers', 'lastReadMessageId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      references: {
        model: {
          tableName: 'Messages',
          schema: 'public',
        },
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChatMembers', 'lastReadMessageId')
  }
};
