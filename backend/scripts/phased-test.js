const express = require('express');
const { sequelize } = require('../src/database/database');
const config = require('../src/config/config');
const logger = require('../src/utils/logger');

async function testPhase(phase) {
  const app = express();
  let server;
  
  try {
    // 阶段1: 基础Express
    if (phase >= 1) {
      console.log('\n=== 阶段1: 基础Express测试 ===');
      app.get('/', (req, res) => res.send('阶段1正常'));
      server = app.listen(config.app.port, () => {
        console.log(`阶段1服务器运行在 http://localhost:${config.app.port}`);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      server.close();
    }

    // 阶段2: 添加中间件
    if (phase >= 2) {
      console.log('\n=== 阶段2: 中间件测试 ===');
      app.use(require('cors')());
      app.use(require('helmet')());
      app.use(require('morgan')('dev'));
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
      server = app.listen(config.app.port, () => {
        console.log(`阶段2服务器运行在 http://localhost:${config.app.port}`);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      server.close();
    }

    // 阶段3: 数据库连接
    if (phase >= 3) {
      console.log('\n=== 阶段3: 数据库测试 ===');
      console.log('测试数据库连接...');
      await sequelize.authenticate();
      console.log('✅ 数据库连接成功');
    }

    // 阶段4: 完整配置
    if (phase >= 4) {
      console.log('\n=== 阶段4: 完整服务器测试 ===');
      // 添加你的路由和其他配置
      server = app.listen(config.app.port, () => {
        console.log(`阶段4服务器运行在 http://localhost:${config.app.port}`);
      });
      await new Promise(resolve => setTimeout(resolve, 5000));
      server.close();
    }

    console.log('\n✅ 所有测试阶段完成');
  } catch (error) {
    console.error(`❌ 阶段${phase}失败:`, error);
    if (server) server.close();
    process.exit(1);
  }
}

// 从命令行参数获取测试阶段
const phase = parseInt(process.argv[2]) || 4;
testPhase(phase);