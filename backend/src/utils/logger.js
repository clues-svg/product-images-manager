const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config/config');

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// 控制台传输格式
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  logFormat
);

// 文件传输格式
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  logFormat
);

// 创建logger实例
const logger = winston.createLogger({
  level: config.app.env === 'development' ? 'debug' : 'info',
  format: winston.format.json(),
  defaultMeta: { service: config.app.name },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat
    }),
    // 每日轮转文件
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    // 错误日志单独文件
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat
    })
  ]
});

// 处理未捕获的Promise异常
process.on('unhandledRejection', (reason) => {
  throw reason;
});

module.exports = logger;