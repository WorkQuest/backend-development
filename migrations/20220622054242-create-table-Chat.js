'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('Chats', {
			id: {
				primaryKey: true,
				type: Sequelize.DataTypes.STRING,
				unique: true
			},
			type: {
				type: Sequelize.DataTypes.STRING,
				allowNull: false
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
		return queryInterface.dropTable('Chats');
	}
};