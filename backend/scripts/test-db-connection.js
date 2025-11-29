const { sequelize } = require('../src/database/database');
const { logger } = require('../src/utils/logger');

async function test() {
  try {
    console.log('测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    console.log('\n测试表查询...');
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('✅ 表查询成功:', results);
    
    console.log('\n测试用户表数据...');
    const users = await sequelize.query('SELECT * FROM users LIMIT 1');
    console.log('✅ 用户数据查询成功:', users[0]);
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

test();