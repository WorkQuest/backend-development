'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.changeColumn('QuestDisputes', 'decision', {
      type: DataTypes.STRING,
    })
  },

  async down (queryInterface, Sequelize) {

  }
};
