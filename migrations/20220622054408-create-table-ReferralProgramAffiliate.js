'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('ReferralProgramAffiliates', {
      id: {
        primaryKey: true,
        type: Sequelize.DataTypes.STRING
      },
      affiliateUserId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      referralCodeId: {
        type: Sequelize.DataTypes.STRING
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('ReferralProgramAffiliates');
  }
};