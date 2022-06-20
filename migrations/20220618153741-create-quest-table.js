'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('Quests', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        references: { model: 'Users', key: 'id' }
      },
      avatarId: {
        type: Sequelize.DataTypes.STRING,
        references: { model: 'Media', key: 'id' }
      },
      assignedWorkerId: {
        type: Sequelize.DataTypes.STRING,
        references: { model: 'Users', key: 'id' }
      },
      contractAddress: {
        type: Sequelize.DataTypes.STRING
      },
      nonce: {
        type: Sequelize.DataTypes.DECIMAl,
        unique: true
      },
      status: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      price: {
        type: Sequelize.DataTypes.DECIMAL,
        allowNull: false
      },
      payPeriod: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      workplace: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      typeOfEmployment: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      priority: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0
      },
      location: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: false
      },
      locationPlaceName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      locationPostGIS: {
        type: Sequelize.DataTypes.GEOMETRY('POINT', 4326),
      },
      startedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });    
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('Quests');
  }
};
