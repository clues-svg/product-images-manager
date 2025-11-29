const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth');
const imageRoutes = require('./imageRoutes');
const tagRoutes = require('./tagRoutes');
const imageProcessingRoutes = require('./imageProcessing');
const crawlerRoutes = require('./crawlerRoutes');
const aiRoutes = require('./aiRoutes');
const settingsRoutes = require('./settingsRoutes');

// 根路由重定向
router.get('/', (req, res) => {
  res.redirect('/api/v1/health');
});

// 健康检查端点
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    version: require('../config/config').app.version
  });
});

// 设置路由
router.use('/auth', authRoutes);
router.use('/images', imageRoutes);
router.use('/tags', tagRoutes);
router.use('/image-processing', imageProcessingRoutes);
router.use('/crawler', crawlerRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;