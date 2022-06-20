'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('Wallets', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        references: { model: 'Users', key: 'id' }
      },
      address: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      publicKey: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('Wallets');
  }
};
