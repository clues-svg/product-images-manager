const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001; // 使用不同的端口避免冲突

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建uploads目录
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 模拟数据存储
let users = [];
let images = [];
let currentUserId = 1;
let currentImageId = 1;

// 工具函数
function generateToken(userId) {
  return `token_${userId}_${Date.now()}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('_');
  if (parts.length !== 3) return null;
  return parseInt(parts[1]);
}

// 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 40101, error: '需要认证' });
  }
  
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ code: 40102, error: '无效的token' });
  }
  
  req.userId = userId;
  next();
}

// API路由

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '测试服务器运行正常',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// 用户注册
app.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  // 简单验证
  if (!username || !email || !password) {
    return res.status(400).json({ code: 40001, error: '缺少必要字段' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ code: 40002, error: '密码确认不匹配' });
  }
  
  // 检查用户是否已存在
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ code: 40003, error: '用户名或邮箱已存在' });
  }
  
  // 创建用户
  const user = {
    id: currentUserId++,
    username,
    email,
    password, // 实际项目中应该加密
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  res.status(201).json({
    code: 0,
    message: '注册成功',
    data: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

// 用户登录
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ code: 40001, error: '缺少用户名或密码' });
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ code: 40101, error: '用户名或密码错误' });
  }
  
  const token = generateToken(user.id);
  
  res.json({
    code: 0,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  });
});

// 获取当前用户信息
app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ code: 40401, error: '用户不存在' });
  }
  
  res.json({
    code: 0,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

// 图片上传
app.post('/api/v1/images', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 40001, error: '请选择要上传的图片' });
  }
  
  // 处理标签
  let tags = [];
  if (req.body.tags) {
    try {
      tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
    } catch (error) {
      tags = [];
    }
  }
  
  const image = {
    id: currentImageId++,
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
    tags: tags,
    uploadedBy: req.userId || null,
    createdAt: new Date().toISOString()
  };
  
  images.push(image);
  
  res.status(201).json({
    code: 0,
    data: {
      id: image.id,
      filename: image.filename,
      originalName: image.originalName,
      url: `/uploads/${image.filename}`,
      size: image.size,
      tags: image.tags,
      uploadedAt: image.createdAt
    }
  });
});

// 获取图片列表
app.get('/api/v1/images', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const paginatedImages = images.slice(offset, offset + parseInt(limit));
  
  res.json({
    code: 0,
    data: {
      images: paginatedImages.map(img => ({
        ...img,
        url: `/uploads/${img.filename}`,
        thumbnailUrl: `/uploads/thumb_${img.filename}`
      })),
      pagination: {
        total: images.length,
        totalPages: Math.ceil(images.length / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    }
  });
});

// 获取单张图片
app.get('/api/v1/images/:id', (req, res) => {
  const imageId = parseInt(req.params.id);
  const image = images.find(img => img.id === imageId);
  
  if (!image) {
    return res.status(404).json({ code: 40401, error: '图片未找到' });
  }
  
  res.json({
    code: 0,
    data: {
      ...image,
      url: `/uploads/${image.filename}`,
      variants: {
        original: `/uploads/${image.filename}`,
        thumbnail: `/uploads/thumb_${image.filename}`
      }
    }
  });
});

// 更新图片信息
app.put('/api/v1/images/:id', authMiddleware, (req, res) => {
  const imageId = parseInt(req.params.id);
  const imageIndex = images.findIndex(img => img.id === imageId);
  
  if (imageIndex === -1) {
    return res.status(404).json({ code: 40402, error: '图片未找到' });
  }
  
  // 更新图片信息
  if (req.body.tags) {
    images[imageIndex].tags = req.body.tags;
  }
  
  images[imageIndex].updatedAt = new Date().toISOString();
  
  res.json({
    code: 0,
    data: {
      ...images[imageIndex],
      url: `/uploads/${images[imageIndex].filename}`
    }
  });
});

// 删除图片
app.delete('/api/v1/images/:id', authMiddleware, (req, res) => {
  const imageId = parseInt(req.params.id);
  const imageIndex = images.findIndex(img => img.id === imageId);
  
  if (imageIndex === -1) {
    return res.status(404).json({ code: 40404, error: '图片未找到' });
  }
  
  // 删除文件
  const image = images[imageIndex];
  if (fs.existsSync(image.path)) {
    fs.unlinkSync(image.path);
  }
  
  // 从数组中移除
  images.splice(imageIndex, 1);
  
  res.json({
    code: 0,
    message: '图片删除成功',
    data: {
      id: imageId,
      deletedAt: new Date().toISOString()
    }
  });
});

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ code: 40400, error: '接口不存在' });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ code: 50000, error: '服务器内部错误' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`测试服务器运行在 http://localhost:${port}`);
  console.log('API端点:');
  console.log('- GET  /api/v1/health');
  console.log('- POST /api/v1/auth/register');
  console.log('- POST /api/v1/auth/login');
  console.log('- GET  /api/v1/auth/me');
  console.log('- POST /api/v1/images');
  console.log('- GET  /api/v1/images');
  console.log('- GET  /api/v1/images/:id');
  console.log('- PUT  /api/v1/images/:id');
  console.log('- DELETE /api/v1/images/:id');
});

process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});

process.on('SIGTERM', () => {
  console.log('服务器正在关闭...');
  process.exit(0);
});

module.exports = app;