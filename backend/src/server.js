const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize, testConnection } = require('./database/database');
const config = require('./config/config');
const logger = require('./utils/logger');
const { successResponse, errorResponse, notFound } = require('./middlewares/response');
const routes = require('./routes');

console.log('服务器启动中...');
console.log('环境变量:', config.app.env);
console.log('端口:', config.app.port);
console.log('数据库配置:', {
  host: config.db.host,
  database: config.db.database,
  username: config.db.username
});

const app = express();
// 增加EventEmitter最大监听器数量
require('events').defaultMaxListeners = 20;

// 测试数据库连接 - 暂时注释掉，先让服务器启动
// console.log('开始测试数据库连接...');
// const dbConnected = await testConnection();
// console.log('数据库连接结果:', dbConnected);

// 中间件（添加详细日志）
try {
  console.log('加载中间件...');
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(successResponse);
  console.log('中间件加载完成');
} catch (error) {
  console.error('中间件加载失败:', error);
  process.exit(1);
}

// 根路由
app.get('/', (req, res) => {
  res.redirect('/api/v1/health');
});

// API路由
app.use('/api/v1', routes);

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 404处理
app.use(notFound);

// 错误处理中间件
app.use(errorResponse);

// 启动服务器
// 启动服务器前测试数据库连接
testConnection().then(dbConnected => {
  if (!dbConnected) {
    logger.error('数据库连接失败，服务器无法启动');
    process.exit(1);
  }

  const server = app.listen(config.app.port, '0.0.0.0', () => {
    logger.info(`${config.app.name} v${config.app.version} 正在运行`);
    logger.info(`环境: ${config.app.env}`);
    logger.info(`监听端口: ${config.app.port}`);
    logger.info('数据库连接状态: 成功');
  });

  server.on('error', (error) => {
    logger.error('服务器启动失败:', error);
  });
});

// 优雅关闭
// 全局未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM 信号接收，关闭服务器');
  server.close(() => {
    sequelize.close();
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;