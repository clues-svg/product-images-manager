const logger = require('../utils/logger');

// 成功响应
const successResponse = (req, res, next) => {
  res.success = (data = null, message = 'success', code = 200) => {
    res.status(code).json({
      code,
      message,
      data
    });
  };
  next();
};

// 错误响应
const errorResponse = (err, req, res, next) => {
  logger.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    code: statusCode,
    message,
    data: null
  });
};

// 404处理
const notFound = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null
  });
};

module.exports = {
  successResponse,
  errorResponse,
  notFound
};