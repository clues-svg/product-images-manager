const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  // 从请求头获取token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};