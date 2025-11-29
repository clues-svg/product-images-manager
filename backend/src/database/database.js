const { Sequelize } = require('sequelize');
const config = require('../config/config');

// 确保Sequelize正确初始化
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging,
    pool: config.db.pool,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    define: {
      timestamps: true,
      underscored: false,
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// 测试数据库连接
async function testConnection() {
  try {
    console.log('正在连接数据库...', {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      username: config.db.username
    });
    
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', {
      message: error.message,
      original: error.original,
      sql: error.sql
    });
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};