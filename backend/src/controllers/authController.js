const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 生成JWT
    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({ 
      user: { id: user.id, username: user.username, email: user.email },
      token 
    });
  } catch (error) {
    console.error('注册错误详情:', error);
    res.status(500).json({ error: '注册失败', details: error.message });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    // 查找用户
    console.log('Finding user:', email);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: '无效的邮箱或密码' });
    }
    console.log('User found:', user.id);

    // 验证密码
    console.log('Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ error: '无效的邮箱或密码' });
    }

    // 生成JWT
    console.log('Generating JWT...');
    console.log('JWT Secret:', config.jwt.secret ? 'Set' : 'Not Set');
    
    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    console.log('JWT generated');

    res.status(200).json({ 
      user: { id: user.id, username: user.username, email: user.email },
      token 
    });
  } catch (error) {
    console.error('登录错误详情:', error);
    res.status(500).json({ error: '登录失败', details: error.message, stack: error.stack });
  }
};

// 获取当前用户信息
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
};