console.log('开始测试数据库连接...');

async function testDB() {
  try {
    // 只测试数据库连接
    console.log('1. 测试配置文件...');
    const config = require('./src/config/config');
    console.log('数据库配置:', config.db);
    
    console.log('2. 测试数据库连接...');
    const { testConnection } = require('./src/database/database');
    
    // 设置超时
    setTimeout(() => {
      console.log('数据库连接超时，可能是网络问题或数据库不可达');
      process.exit(1);
    }, 10000);
    
    const dbConnected = await testConnection();
    console.log('数据库连接结果:', dbConnected);
    
    if (dbConnected) {
      console.log('✓ 数据库连接成功');
      process.exit(0);
    } else {
      console.log('✗ 数据库连接失败');
      process.exit(1);
    }

  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

testDB();