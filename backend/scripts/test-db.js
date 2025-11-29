const { testConnection } = require('../src/database/database');

async function test() {
  console.log('正在测试数据库连接...');
  const success = await testConnection();
  if (success) {
    console.log('数据库连接测试成功');
    process.exit(0);
  } else {
    console.error('数据库连接测试失败');
    process.exit(1);
  }
}

test();