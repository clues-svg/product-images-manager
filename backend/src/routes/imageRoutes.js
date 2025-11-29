const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { sequelize } = require('../database/database');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/auth');

// 简单的logger实现
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 获取文件扩展名
    const ext = path.extname(file.originalname);
    // 生成唯一文件名：时间戳 + 随机数 + 扩展名
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
});

// 图片上传
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // 1. 验证文件是否存在
    if (!req.file) {
      logger.warn('图片上传失败: 未选择文件', { ip: req.ip });
      return res.status(400).json({ 
        code: 40001,
        error: '请选择要上传的图片',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: '10MB'
      });
    }

    // 2. 记录上传信息
    logger.info('图片上传请求', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      ip: req.ip
    });

    // 3. 获取图片尺寸信息
    const sharp = require('sharp');
    let width = null, height = null, aspectRatio = null;
    
    try {
      const metadata = await sharp(req.file.path).metadata();
      width = metadata.width;
      height = metadata.height;
      aspectRatio = width && height ? (width / height) : null;
    } catch (error) {
      logger.warn('获取图片尺寸失败', { error: error.message });
    }

    // 4. 处理标签数据
    let tags = [];
    if (req.body.tags) {
      try {
        // 如果是JSON字符串，解析它
        if (typeof req.body.tags === 'string') {
          tags = JSON.parse(req.body.tags);
        } else if (Array.isArray(req.body.tags)) {
          tags = req.body.tags;
        }
        
        // 去重并过滤空标签
        tags = [...new Set(tags)]
          .filter(tag => tag && tag.trim().length > 0)
          .slice(0, 10); // 限制最多10个标签
          
        logger.info('上传图片 - 处理标签', { originalTags: req.body.tags, processedTags: tags });
      } catch (error) {
        logger.warn('解析标签数据失败', { tags: req.body.tags, error: error.message });
        tags = [];
      }
    }

    // 5. 创建图片记录
    // 修复中文文件名编码问题
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    const newImage = await Image.create({
      filename: req.file.filename,
      originalName: originalName, // 保存修复编码后的原始文件名
      path: req.file.path.replace(/\\/g, '/'), // 统一路径分隔符
      size: req.file.size,
      mimetype: req.file.mimetype,
      width: width,
      height: height,
      aspectRatio: aspectRatio,
      source: 'upload', // 设置来源为用户上传
      processType: 'original', // 设置为原始状态
      uploadedBy: req.userId || null,
      tags: tags // 添加标签
    });

    // 6. 返回成功响应
    logger.info('图片上传成功', { 
      imageId: newImage.id,
      path: newImage.path,
      tags: newImage.tags
    });
    
    res.status(201).json({
      code: 0,
      data: {
        id: newImage.id,
        filename: newImage.filename,
        originalName: newImage.originalName,
        url: `/uploads/${newImage.filename}`,
        size: newImage.size,
        tags: newImage.tags,
        uploadedAt: newImage.createdAt
      }
    });

  } catch (error) {
    // 5. 错误处理
    logger.error('图片上传失败', { 
      error: error.message,
      stack: error.stack,
      ip: req.ip 
    });

    // 删除已上传的文件（如果有）
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      code: 50001,
      error: '图片上传失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取图片列表
router.get('/', async (req, res) => {
  try {
    // 1. 解析查询参数
    const { 
      page = 1, 
      limit = 20, 
      tags, 
      tagLogic = 'and',
      sourceFilter,
      aspectRatio,
      search,
      sort = 'createdAt', 
      order = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;

    // 2. 构建查询条件
    const where = {};
    
    // 多标签筛选（支持与或逻辑）
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      logger.info('标签筛选', { tags: tagArray, tagLogic });
      
      if (tagLogic === 'or') {
        // 或逻辑：包含任意一个标签
        // 使用 JSON_CONTAINS 函数进行 MySQL JSON 数组查询
        where[Op.or] = tagArray.map(tag => 
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('tags'), JSON.stringify(tag)),
            1
          )
        );
      } else {
        // 与逻辑：包含所有标签
        // 每个标签都必须存在
        const tagConditions = tagArray.map(tag => 
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('tags'), JSON.stringify(tag)),
            1
          )
        );
        where[Op.and] = tagConditions;
      }
    }
    
    // 级联来源筛选
    if (sourceFilter && Array.isArray(sourceFilter) && sourceFilter.length > 0) {
      const [sourceType, subFilter] = sourceFilter;
      where.source = sourceType;
      
      if (subFilter) {
        switch (sourceType) {
          case 'upload':
            where.uploadedBy = subFilter; // 按用户ID筛选
            break;
          case 'processed':
            where.processType = subFilter; // 按处理类型筛选
            break;
          case 'crawler':
            where.sourceUrl = { [Op.like]: `%${subFilter}%` }; // 按网站URL筛选
            break;
          case 'ai_generated':
            where.aiModel = subFilter; // 按AI模型筛选
            break;
        }
      }
    }
    
    // 尺寸比例筛选
    if (aspectRatio) {
      const ratioMap = {
        // 具体比例
        '3:1': { min: 2.5, max: 3.5 },
        '1:1': { min: 0.8, max: 1.2 },
        '1:2': { min: 0.4, max: 0.6 },
        '16:9': { min: 1.6, max: 1.9 },
        '4:3': { min: 1.2, max: 1.4 },
        // 描述性名称
        'square': { min: 0.8, max: 1.2 },      // 正方形 (1:1)
        'landscape': { min: 1.3, max: 10 },    // 横向 (宽>高)
        'portrait': { min: 0.1, max: 0.7 },    // 纵向 (高>宽)
        'wide': { min: 2.0, max: 10 },         // 超宽 (2:1以上)
        'tall': { min: 0.1, max: 0.5 }         // 超高 (1:2以下)
      };
      
      if (ratioMap[aspectRatio]) {
        const { min, max } = ratioMap[aspectRatio];
        where.aspectRatio = {
          [Op.between]: [min, max]
        };
      } else if (aspectRatio === 'other') {
        // 其他比例：不在常见比例范围内
        const commonRanges = Object.values(ratioMap);
        where[Op.and] = commonRanges.map(range => ({
          aspectRatio: {
            [Op.not]: {
              [Op.between]: [range.min, range.max]
            }
          }
        }));
      }
    }
    
    // 搜索功能（文件名或原始文件名）
    if (search) {
      where[Op.or] = [
        { filename: { [Op.like]: `%${search}%` } },
        { originalName: { [Op.like]: `%${search}%` } }
      ];
    }

    // 3. 查询图片
    const { count, rows } = await Image.findAndCountAll({
      where,
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'filename', 'originalName', 'size', 'mimetype', 'tags', 'source', 'sourceUrl', 'processType', 'parentImageId', 'createdAt', 'width', 'height', 'aspectRatio', 'aiModel']
    });

    // 4. 构建响应
    const totalPages = Math.ceil(count / limit);
    const nextPage = page < totalPages ? parseInt(page) + 1 : null;
    const prevPage = page > 1 ? parseInt(page) - 1 : null;

    res.json({
      code: 0,
      data: {
        images: rows.map(img => ({
          ...img.get({ plain: true }),
          url: `/uploads/${img.filename}`,
          thumbnailUrl: `/uploads/thumb_${img.filename}`
        })),
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          nextPage,
          prevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取图片列表失败', { 
      error: error.message,
      query: req.query 
    });
    
    res.status(500).json({
      code: 50002,
      error: '获取图片列表失败'
    });
  }
});

// 获取单张图片
router.get('/:id', async (req, res) => {
  try {
    // 1. 记录访问日志
    logger.info('图片访问请求', {
      imageId: req.params.id,
      ip: req.ip,
      accept: req.headers['accept']
    });

    // 2. 查询图片
    const image = await Image.findByPk(req.params.id, {
      attributes: ['id', 'filename', 'size', 'mimetype', 'tags', 'createdAt', 'width', 'height']
    });

    if (!image) {
      logger.warn('图片未找到', { imageId: req.params.id });
      return res.status(404).json({ 
        code: 40401,
        error: '图片未找到' 
      });
    }

    // 3. 设置缓存头
    res.set('Cache-Control', 'public, max-age=3600'); // 1小时缓存
    res.set('Last-Modified', new Date(image.updatedAt).toUTCString());

    // 4. 根据请求头返回不同格式
    const accept = req.headers['accept'] || '';
    const baseUrl = `/uploads/${image.filename}`;

    if (accept.includes('application/json')) {
      // 返回JSON格式
      res.json({
        code: 0,
        data: {
          ...image.get({ plain: true }),
          url: baseUrl,
          variants: {
            original: baseUrl,
            thumbnail: `/uploads/thumb_${image.filename}`,
            medium: `/uploads/medium_${image.filename}`
          },
          related: await getRelatedImages(image.id, image.tags)
        }
      });
    } else {
      // 重定向到实际图片
      res.redirect(301, baseUrl);
    }

  } catch (error) {
    logger.error('获取图片详情失败', {
      imageId: req.params.id,
      error: error.message
    });
    
    res.status(500).json({
      code: 50003,
      error: '获取图片详情失败'
    });
  }
});

// 获取相关图片
async function getRelatedImages(imageId, tags) {
  if (!tags || tags.length === 0) return [];
  
  return await Image.findAll({
    where: {
      id: { [Op.ne]: imageId },
      tags: { [Op.overlap]: tags }
    },
    limit: 4,
    attributes: ['id', 'filename'],
    order: sequelize.random()
  });
}

// 更新图片信息
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. 获取用户信息
    const userId = req.userId;
    if (!userId) {
      logger.warn('未授权更新尝试', { 
        imageId: req.params.id,
        ip: req.ip 
      });
      return res.status(401).json({ 
        code: 40101,
        error: '需要登录才能更新图片信息' 
      });
    }

    // 2. 获取当前图片
    const image = await Image.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ 
        code: 40402,
        error: '图片未找到' 
      });
    }

    // 3. 记录操作日志
    logger.info('图片更新请求', {
      imageId: req.params.id,
      userId: userId,
      changes: req.body
    });

    // 4. 处理标签更新
    if (req.body.tags) {
      // 去重并过滤空标签
      req.body.tags = [...new Set(req.body.tags)]
        .filter(tag => tag && tag.trim().length > 0)
        .slice(0, 10); // 限制最多10个标签
    }

    // 5. 执行更新
    const [updated] = await Image.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedImage = await Image.findByPk(req.params.id, {
        attributes: ['id', 'filename', 'tags', 'updatedAt']
      });

      logger.info('图片更新成功', {
        imageId: updatedImage.id,
        updatedFields: Object.keys(req.body)
      });

      return res.json({
        code: 0,
        data: {
          ...updatedImage.get({ plain: true }),
          url: `/uploads/${updatedImage.filename}`
        }
      });
    }

    res.status(404).json({ 
      code: 40403,
      error: '图片未找到或未更改' 
    });

  } catch (error) {
    logger.error('图片更新失败', {
      imageId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      code: 50004,
      error: '图片更新失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 删除图片
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // 1. 获取用户信息
    const userId = req.userId;
    if (!userId) {
      logger.warn('未授权删除尝试', {
        imageId: req.params.id,
        ip: req.ip
      });
      return res.status(401).json({
        code: 40102,
        error: '需要登录才能删除图片'
      });
    }

    // 2. 获取图片信息
    const image = await Image.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({
        code: 40404,
        error: '图片未找到'
      });
    }

    // 3. 记录操作日志
    logger.info('图片删除请求', {
      imageId: req.params.id,
      userId: userId,
      filename: image.filename
    });

    // 4. 执行软删除
    await image.destroy();

    // 5. 异步删除实际文件
    const filePath = path.join(__dirname, '../../uploads', image.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error('删除图片文件失败', {
          imageId: req.params.id,
          error: err.message
        });
      } else {
        logger.info('图片文件已删除', {
          imageId: req.params.id,
          filePath
        });
      }
    });

    res.json({
      code: 0,
      message: '图片删除成功',
      data: {
        id: req.params.id,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('图片删除失败', {
      imageId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      code: 50005,
      error: '图片删除失败'
    });
  }
});

module.exports = router;