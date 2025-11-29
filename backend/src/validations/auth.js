const { body } = require('express-validator');

// 注册验证规则
const registerSchema = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位')
];

// 登录验证规则
const loginSchema = [
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空')
];

module.exports = {
  registerSchema,
  loginSchema
};