const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 请求验证中间件
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    logger.warn('请求验证失败:', errors.array());
    res.status(400).json({
      code: 400,
      message: '请求参数错误',
      data: errors.array()
    });
  };
};

module.exports = {
  validate
};