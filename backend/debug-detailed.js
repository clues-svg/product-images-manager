// 详细调试脚本
console.log('=== 详细服务器调试 ===');

async function debugServer() {
  try {
  console.log('1. 检查所有核心模块...');
  const modules = [
    'express', 'cors', 'helmet', 'morgan', 
    'express-validator', 'mysql2', 'sequelize',
    'winston', 'winston-daily-rotate-file'
  ];
  
  modules.forEach(mod => {
    try {
      require(mod);
      console.log(`✓ ${mod} 正常`);
    } catch (e) {
      console.log(`✗ ${mod} 缺失: ${e.message}`);
    }
  });

  console.log('2. 检查配置文件...');
  const config = require('./src/config/config');
  console.log('应用配置:', config.app);
  console.log('数据库配置:', config.db);

  console.log('3. 检查数据库连接...');
  const { testConnection } = require('./src/database/database');
  const dbResult = await testConnection();
  console.log('数据库连接:', dbResult);

  console.log('4. 检查中间件...');
  require('./src/middlewares/response');
  require('./src/middlewares/validator');
  require('./src/middlewares/auth');
  console.log('✓ 中间件正常');

  console.log('5. 检查路由...');
  require('./src/routes');
  console.log('✓ 路由正常');

  console.log('6. 启动测试服务器...');
  const express = require('express');
  const app = express();
  
  app.use(require('cors')());
  app.use(require('helmet')());
  app.use(require('morgan')('dev'));
  app.use(express.json());
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
  
  const server = app.listen(3001, () => {
    console.log('✓ 测试服务器启动成功，端口: 3001');
    console.log('健康检查: http://localhost:3001/health');
    
    setTimeout(() => {
      server.close();
      console.log('测试完成');
      process.exit(0);
    }, 3000);
  });

} catch (error) {
  console.error('调试失败:', error.message);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
  }
}

debugServer();