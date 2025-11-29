'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: '#1890ff'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 添加索引
    await queryInterface.addIndex('tags', ['name']);
    await queryInterface.addIndex('tags', ['createdBy']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tags');
  }
};