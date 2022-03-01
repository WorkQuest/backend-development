'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('Reviews', 'QuestsReviews');
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameTable('QuestsReviews', 'Reviews');
  }
};
