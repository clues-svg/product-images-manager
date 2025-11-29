// 简单的服务器启动测试
console.log('=== 服务器启动调试 ===');

try {
  // 1. 检查基础模块
  console.log('1. 检查基础模块...');
  require('express');
  require('cors'); 
  require('helmet');
  require('morgan');
  console.log('✓ 基础模块正常');
  
  // 2. 检查配置文件
  console.log('2. 检查配置文件...');
  const config = require('./src/config/config');
  console.log('配置:', config.app);
  
  // 3. 创建简单的express应用测试
  console.log('3. 创建简单Express应用...');
  const express = require('express');
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ message: '测试成功', timestamp: new Date() });
  });
  
  const server = app.listen(config.app.port, () => {
    console.log(`✓ 服务器启动成功，监听端口: ${config.app.port}`);
    console.log('测试URL: http://localhost:' + config.app.port + '/test');
    
    // 5秒后关闭测试服务器
    setTimeout(() => {
      server.close();
      console.log('测试服务器已关闭');
      process.exit(0);
    }, 5000);
  });
  
} catch (error) {
  console.error('启动失败:', error.message);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}