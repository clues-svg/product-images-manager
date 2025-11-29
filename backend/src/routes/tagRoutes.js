const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const Tag = require('../models/Tag');
const { sequelize } = require('../database/database');
const { Op } = require('sequelize');
const authMiddleware = require('../middlewares/auth');

// 简单的logger实现
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

// 创建新标签
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        code: 40001,
        error: '标签名不能为空'
      });
    }

    const normalizedName = name.trim();
    
    // 检查标签是否已存在
    const existingTag = await Tag.findOne({
      where: { name: normalizedName }
    });

    if (existingTag) {
      return res.status(400).json({
        code: 40002,
        error: '标签已存在'
      });
    }

    // 创建新标签
    const newTag = await Tag.create({
      name: normalizedName,
      description: description || '',
      color: color || '#1890ff',
      createdBy: req.userId
    });

    logger.info(`创建新标签: "${normalizedName}"`);

    res.json({
      code: 0,
      data: {
        id: newTag.id,
        name: newTag.name,
        description: newTag.description,
        color: newTag.color,
        count: 0,
        createdAt: newTag.createdAt
      }
    });

  } catch (error) {
    logger.error('创建标签失败:', error);
    res.status(500).json({
      code: 50002,
      error: '创建标签失败'
    });
  }
});

// 获取所有标签及其统计信息
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      search = '',
      sort = 'name',
      order = 'ASC',
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;

    // 1. 获取独立创建的标签
    const whereClause = {};
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const createdTags = await Tag.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'color', 'createdAt']
    });

    // 2. 获取所有图片的标签
    const images = await Image.findAll({
      attributes: ['tags'],
      where: {
        tags: { [Op.ne]: null }
      }
    });

    // 3. 统计图片中标签的使用次数
    const imageTagStats = {};
    images.forEach(image => {
      if (image.tags && Array.isArray(image.tags)) {
        image.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim();
            imageTagStats[normalizedTag] = (imageTagStats[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // 4. 合并独立标签和图片标签
    const tagMap = new Map();

    // 添加独立创建的标签
    createdTags.forEach(tag => {
      tagMap.set(tag.name, {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        color: tag.color,
        count: imageTagStats[tag.name] || 0,
        isCreated: true,
        createdAt: tag.createdAt
      });
    });

    // 添加仅存在于图片中的标签
    Object.entries(imageTagStats).forEach(([name, count]) => {
      if (!tagMap.has(name)) {
        tagMap.set(name, {
          id: name,
          name,
          description: '',
          color: '#1890ff',
          count,
          isCreated: false,
          createdAt: null
        });
      }
    });

    // 5. 转换为数组并应用搜索过滤
    let tagList = Array.from(tagMap.values());
    
    if (search) {
      tagList = tagList.filter(tag => 
        tag.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 6. 排序
    tagList.sort((a, b) => {
      if (sort === 'name') {
        return order === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sort === 'count') {
        return order === 'ASC' ? a.count - b.count : b.count - a.count;
      }
      return 0;
    });

    // 7. 分页
    const total = tagList.length;
    const paginatedTags = tagList.slice(offset, offset + parseInt(limit));

    logger.info(`获取标签列表成功，共 ${total} 个标签（独立创建: ${createdTags.length}, 图片标签: ${Object.keys(imageTagStats).length}）`);

    res.json({
      code: 0,
      data: {
        tags: paginatedTags,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          nextPage: page * limit < total ? parseInt(page) + 1 : null,
          prevPage: page > 1 ? parseInt(page) - 1 : null,
          limit: parseInt(limit)
        },
        summary: {
          totalTags: total,
          totalUsage: Object.values(imageTagStats).reduce((sum, count) => sum + count, 0),
          createdTags: createdTags.length,
          imageTags: Object.keys(imageTagStats).length
        }
      }
    });

  } catch (error) {
    logger.error('获取标签列表失败:', error);
    res.status(500).json({
      code: 50002,
      error: '获取标签列表失败'
    });
  }
});

// 获取标签详情（包含关联的图片）
router.get('/:tagName', authMiddleware, async (req, res) => {
  try {
    const { tagName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 查找包含该标签的图片 - 使用LIKE查询兼容MySQL
    const { count, rows: images } = await Image.findAndCountAll({
      where: {
        tags: { [Op.like]: `%${tagName}%` }
      },
      attributes: ['id', 'filename', 'originalName', 'size', 'mimetype', 'tags', 'createdAt', 'width', 'height'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 添加图片URL
    const imagesWithUrls = images.map(image => ({
      ...image.toJSON(),
      url: `/uploads/${image.filename}`,
      thumbnailUrl: `/uploads/thumb_${image.filename}`
    }));

    logger.info(`获取标签 "${tagName}" 详情成功，关联 ${count} 张图片`);

    res.json({
      code: 0,
      data: {
        tag: {
          name: tagName,
          count: count
        },
        images: imagesWithUrls,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          nextPage: page * limit < count ? parseInt(page) + 1 : null,
          prevPage: page > 1 ? parseInt(page) - 1 : null,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取标签详情失败:', error);
    res.status(500).json({
      code: 50002,
      error: '获取标签详情失败'
    });
  }
});

// 重命名标签
router.put('/:tagName', authMiddleware, async (req, res) => {
  try {
    const { tagName } = req.params;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({
        code: 40001,
        error: '新标签名不能为空'
      });
    }

    const normalizedNewName = newName.trim();
    
    if (normalizedNewName === tagName) {
      return res.status(400).json({
        code: 40001,
        error: '新标签名与原标签名相同'
      });
    }

    // 查找所有包含该标签的图片 - 使用LIKE查询兼容MySQL
    const images = await Image.findAll({
      where: {
        tags: { [Op.like]: `%${tagName}%` }
      }
    });

    let updatedCount = 0;

    // 更新每张图片的标签
    for (const image of images) {
      if (image.tags && Array.isArray(image.tags)) {
        const updatedTags = image.tags.map(tag => 
          tag === tagName ? normalizedNewName : tag
        );
        
        await image.update({ tags: updatedTags });
        updatedCount++;
      }
    }

    logger.info(`标签重命名成功: "${tagName}" -> "${normalizedNewName}"，更新了 ${updatedCount} 张图片`);

    res.json({
      code: 0,
      data: {
        oldName: tagName,
        newName: normalizedNewName,
        updatedImages: updatedCount
      }
    });

  } catch (error) {
    logger.error('重命名标签失败:', error);
    res.status(500).json({
      code: 50002,
      error: '重命名标签失败'
    });
  }
});

// 删除标签
router.delete('/:tagName', authMiddleware, async (req, res) => {
  try {
    const { tagName } = req.params;

    // 查找所有包含该标签的图片 - 使用LIKE查询兼容MySQL
    const images = await Image.findAll({
      where: {
        tags: { [Op.like]: `%"${tagName}"%` }
      }
    });

    let updatedCount = 0;

    // 从每张图片中移除该标签
    for (const image of images) {
      if (image.tags && Array.isArray(image.tags)) {
        const updatedTags = image.tags.filter(tag => tag !== tagName);
        await image.update({ tags: updatedTags });
        updatedCount++;
      }
    }

    logger.info(`标签删除成功: "${tagName}"，从 ${updatedCount} 张图片中移除`);

    res.json({
      code: 0,
      data: {
        deletedTag: tagName,
        updatedImages: updatedCount
      }
    });

  } catch (error) {
    logger.error('删除标签失败:', error);
    res.status(500).json({
      code: 50002,
      error: '删除标签失败'
    });
  }
});

// 合并标签
router.post('/merge', authMiddleware, async (req, res) => {
  try {
    const { sourceTags, targetTag } = req.body;

    if (!sourceTags || !Array.isArray(sourceTags) || sourceTags.length === 0) {
      return res.status(400).json({
        code: 40001,
        error: '源标签列表不能为空'
      });
    }

    if (!targetTag || !targetTag.trim()) {
      return res.status(400).json({
        code: 40001,
        error: '目标标签不能为空'
      });
    }

    const normalizedTargetTag = targetTag.trim();
    let totalUpdatedImages = 0;

    // 对每个源标签进行合并
    for (const sourceTag of sourceTags) {
      if (sourceTag === normalizedTargetTag) continue; // 跳过相同的标签

      const images = await Image.findAll({
        where: {
          tags: { [Op.like]: `%${sourceTag}%` }
        }
      });

      for (const image of images) {
        if (image.tags && Array.isArray(image.tags)) {
          let updatedTags = image.tags.filter(tag => tag !== sourceTag);
          
          // 如果目标标签不存在，则添加
          if (!updatedTags.includes(normalizedTargetTag)) {
            updatedTags.push(normalizedTargetTag);
          }
          
          await image.update({ tags: updatedTags });
          totalUpdatedImages++;
        }
      }
    }

    logger.info(`标签合并成功: [${sourceTags.join(', ')}] -> "${normalizedTargetTag}"，更新了 ${totalUpdatedImages} 张图片`);

    res.json({
      code: 0,
      data: {
        sourceTags,
        targetTag: normalizedTargetTag,
        updatedImages: totalUpdatedImages
      }
    });

  } catch (error) {
    logger.error('合并标签失败:', error);
    res.status(500).json({
      code: 50002,
      error: '合并标签失败'
    });
  }
});

// 批量删除标签
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        code: 40001,
        error: '标签列表不能为空'
      });
    }

    let totalUpdatedImages = 0;

    // 对每个标签进行删除
    for (const tagName of tags) {
      const images = await Image.findAll({
        where: {
          tags: { [Op.like]: `%${tagName}%` }
        }
      });

      for (const image of images) {
        if (image.tags && Array.isArray(image.tags)) {
          const updatedTags = image.tags.filter(tag => tag !== tagName);
          await image.update({ tags: updatedTags });
          totalUpdatedImages++;
        }
      }
    }

    logger.info(`批量删除标签成功: [${tags.join(', ')}]，更新了 ${totalUpdatedImages} 张图片`);

    res.json({
      code: 0,
      data: {
        deletedTags: tags,
        updatedImages: totalUpdatedImages
      }
    });

  } catch (error) {
    logger.error('批量删除标签失败:', error);
    res.status(500).json({
      code: 50002,
      error: '批量删除标签失败'
    });
  }
});

// 获取标签建议（基于现有标签的模糊匹配）
router.get('/suggestions/:query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (!query || query.length < 1) {
      return res.json({
        code: 0,
        data: { suggestions: [] }
      });
    }

    // 获取所有标签
    const images = await Image.findAll({
      attributes: ['tags'],
      where: {
        tags: { [Op.ne]: null }
      }
    });

    // 收集所有唯一标签
    const allTags = new Set();
    images.forEach(image => {
      if (image.tags && Array.isArray(image.tags)) {
        image.tags.forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });

    // 模糊匹配
    const suggestions = Array.from(allTags)
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
      .slice(0, parseInt(limit))
      .sort();

    res.json({
      code: 0,
      data: { suggestions }
    });

  } catch (error) {
    logger.error('获取标签建议失败:', error);
    res.status(500).json({
      code: 50002,
      error: '获取标签建议失败'
    });
  }
});

// 批量应用标签
router.post('/batch-apply', authMiddleware, async (req, res) => {
  try {
    const { rules, tagsToAdd } = req.body;
    const userId = req.userId;

    if (!rules || !tagsToAdd || tagsToAdd.length === 0) {
      return res.status(400).json({
        code: 40001,
        message: '请提供应用规则和要添加的标签'
      });
    }

    logger.info('批量应用标签请求', {
      userId,
      rules,
      tagsToAdd
    });

    // 构建查询条件
    const whereConditions = [];
    const { includeKeywords = [], excludeKeywords = [], mustIncludeKeywords = [] } = rules;

    // 包含关键词（OR条件）
    if (includeKeywords.length > 0) {
      const includeConditions = includeKeywords.map(keyword => ({
        [Op.or]: [
          { originalName: { [Op.like]: `%${keyword}%` } },
          { filename: { [Op.like]: `%${keyword}%` } }
        ]
      }));
      whereConditions.push({ [Op.or]: includeConditions });
    }

    // 必须包含关键词（AND条件）
    if (mustIncludeKeywords.length > 0) {
      const mustIncludeConditions = mustIncludeKeywords.map(keyword => ({
        [Op.or]: [
          { originalName: { [Op.like]: `%${keyword}%` } },
          { filename: { [Op.like]: `%${keyword}%` } }
        ]
      }));
      whereConditions.push({ [Op.and]: mustIncludeConditions });
    }

    // 排除关键词（NOT条件）
    if (excludeKeywords.length > 0) {
      const excludeConditions = excludeKeywords.map(keyword => ({
        [Op.and]: [
          { originalName: { [Op.notLike]: `%${keyword}%` } },
          { filename: { [Op.notLike]: `%${keyword}%` } }
        ]
      }));
      whereConditions.push({ [Op.and]: excludeConditions });
    }

    // 如果没有任何条件，返回错误
    if (whereConditions.length === 0) {
      return res.status(400).json({
        code: 40002,
        message: '请至少提供一个筛选条件'
      });
    }

    // 查找匹配的图片
    const matchedImages = await Image.findAll({
      where: {
        [Op.and]: whereConditions,
        userId: userId
      },
      attributes: ['id', 'originalName', 'filename', 'tags']
    });

    logger.info('找到匹配图片', {
      count: matchedImages.length,
      conditions: whereConditions
    });

    // 批量更新图片标签
    let updatedCount = 0;
    for (const image of matchedImages) {
      const existingTags = image.tags || [];
      const newTags = [...new Set([...existingTags, ...tagsToAdd])]; // 去重合并
      
      if (newTags.length > existingTags.length) {
        await Image.update(
          { tags: newTags },
          { where: { id: image.id } }
        );
        updatedCount++;
      }
    }

    logger.info('批量应用标签完成', {
      matchedImages: matchedImages.length,
      updatedImages: updatedCount,
      tagsAdded: tagsToAdd
    });

    res.json({
      code: 0,
      message: '批量应用标签成功',
      data: {
        matchedImages: matchedImages.length,
        updatedImages: updatedCount,
        tagsAdded: tagsToAdd
      }
    });

  } catch (error) {
    logger.error('批量应用标签失败:', error);
    res.status(500).json({
      code: 50001,
      message: '批量应用标签失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;