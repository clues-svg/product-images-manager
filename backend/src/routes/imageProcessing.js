const express = require('express');
const router = express.Router();
const imageProcessingController = require('../controllers/imageProcessingController');

// 去除背景
router.post('/remove-background/:imageId', imageProcessingController.removeBackground);

// 生成场景
router.post('/generate-scene/:productImageId', imageProcessingController.generateScene);

// 批量处理
router.post('/batch-process', imageProcessingController.batchProcess);

// 调整尺寸
router.post('/resize/:imageId', imageProcessingController.resize);

// 添加边框
router.post('/add-border/:imageId', imageProcessingController.addBorder);

// 获取处理历史
router.get('/history/:imageId', imageProcessingController.getProcessHistory);

module.exports = router;