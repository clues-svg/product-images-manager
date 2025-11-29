const imageProcessingService = require('../services/imageProcessingService');
const { Image } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class ImageProcessingController {
  /**
   * 去除背景
   */
  async removeBackground(req, res) {
    try {
      const { imageId } = req.params;
      const { tolerance = 30, size = 'auto' } = req.body;

      // 查找图片记录
      const image = await Image.findByPk(imageId);
      if (!image) {
        return res.status(404).json({ error: '图片不存在' });
      }

      // 生成输出文件名
      const inputPath = image.path || path.join('uploads', image.filename);
      const outputFileName = `${path.parse(image.filename).name}_no_bg.png`;
      const outputPath = `uploads/${outputFileName}`;

      // 执行背景去除
      const result = await imageProcessingService.removeBackground(inputPath, outputPath, {
        tolerance: parseInt(tolerance),
        size
      });

      if (result.success) {
        // 创建新的图片记录
        const newImage = await Image.create({
          filename: outputFileName,
          originalName: `${image.originalName}_去背景`,
          path: outputPath,
          size: result.size,
          mimetype: 'image/png',
          tags: [
            ...(Array.isArray(image.tags) ? image.tags : 
                typeof image.tags === 'string' ? JSON.parse(image.tags || '[]') : []), 
            '去背景', '透明背景'
          ],
          source: 'processed',
          processType: 'background_removed',
          parentId: imageId
        });

        // 获取图片尺寸
        const sharp = require('sharp');
        const metadata = await sharp(outputPath).metadata();
        await newImage.update({
          width: metadata.width,
          height: metadata.height
        });

        logger.info(`背景去除成功: ${imageId} -> ${newImage.id}`);
        
        res.json({
          success: true,
          message: '背景去除成功',
          originalImage: image,
          processedImage: newImage,
          result
        });
      } else {
        res.status(500).json({ error: '背景去除失败' });
      }

    } catch (error) {
      logger.error('背景去除控制器错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 生成场景
   */
  async generateScene(req, res) {
    try {
      const { productImageId } = req.params;
      const { 
        sceneImageId, 
        sceneType = 'ai_generated',
        width = 1200, 
        height = 1200,
        colors = ['#f0f8ff', '#e6f3ff'],
        quality = 90,
        blend = 'over'
      } = req.body;

      // 查找产品图片
      const productImage = await Image.findByPk(productImageId);
      if (!productImage) {
        return res.status(404).json({ error: '产品图片不存在' });
      }

      let sceneImagePath = null;
      let sceneImage = null;

      // 如果指定了场景图片ID，查找场景图片
      if (sceneImageId) {
        sceneImage = await Image.findByPk(sceneImageId);
        if (!sceneImage) {
          return res.status(404).json({ error: '场景图片不存在' });
        }
        sceneImagePath = sceneImage.path || path.join('uploads', sceneImage.filename);
      }

      // 生成输出文件名
      const outputFileName = `${path.parse(productImage.filename).name}_scene_${Date.now()}.jpg`;
      const productImagePath = productImage.path || path.join('uploads', productImage.filename);
      const outputPath = `uploads/${outputFileName}`;

      // 执行场景生成
      const result = await imageProcessingService.generateScene(
        productImage.path || path.join('uploads', productImage.filename),
        sceneImagePath,
        outputPath,
        {
          width: parseInt(width),
          height: parseInt(height),
          colors: Array.isArray(colors) ? colors : [colors],
          quality: parseInt(quality),
          blend
        }
      );

      if (result.success) {
        // 创建新的图片记录
        const tags = [
          ...(Array.isArray(productImage.tags) ? productImage.tags : 
              typeof productImage.tags === 'string' ? JSON.parse(productImage.tags || '[]') : [])
        ];
        if (sceneImage) {
          tags.push('场景合成', '产品展示');
        } else {
          tags.push('AI场景', '智能生成');
        }

        const newImage = await Image.create({
          filename: outputFileName,
          originalName: `${productImage.originalName}_场景图`,
          path: outputPath,
          size: result.size,
          width: result.width,
          height: result.height,
          mimetype: 'image/jpeg',
          tags: tags,
          source: 'processed',
          processType: 'background_added',
          parentId: productImageId
        });

        logger.info(`场景生成成功: ${productImageId} -> ${newImage.id}`);
        
        res.json({
          success: true,
          message: '场景生成成功',
          productImage,
          sceneImage,
          processedImage: newImage,
          result
        });
      } else {
        res.status(500).json({ error: '场景生成失败' });
      }

    } catch (error) {
      logger.error('场景生成控制器错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 调整尺寸
   */
  async resize(req, res) {
    try {
      const { imageId } = req.params;
      const { width, height, fit } = req.body;

      const image = await Image.findByPk(imageId);
      if (!image) {
        return res.status(404).json({ error: '图片不存在' });
      }

      const outputFileName = `${path.parse(image.filename).name}_resize_${width}x${height}.jpg`;
      const inputPath = image.path || path.join('uploads', image.filename);
      const outputPath = `uploads/${outputFileName}`;

      const result = await imageProcessingService.resize(inputPath, outputPath, {
        width,
        height,
        fit
      });

      if (result.success) {
        const newImage = await Image.create({
          filename: outputFileName,
          originalName: `${image.originalName}_调整尺寸`,
          path: outputPath,
          size: result.size,
          width: result.width,
          height: result.height,
          mimetype: 'image/jpeg',
          tags: [...(Array.isArray(image.tags) ? image.tags : []), '调整尺寸'],
          source: 'processed',
          processType: 'resized',
          parentId: imageId
        });

        res.json({
          success: true,
          message: '尺寸调整成功',
          processedImage: newImage,
          result
        });
      } else {
        res.status(500).json({ error: '尺寸调整失败' });
      }
    } catch (error) {
      logger.error('尺寸调整控制器错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 添加边框
   */
  async addBorder(req, res) {
    try {
      const { imageId } = req.params;
      const { size, color } = req.body;

      const image = await Image.findByPk(imageId);
      if (!image) {
        return res.status(404).json({ error: '图片不存在' });
      }

      const outputFileName = `${path.parse(image.filename).name}_border.jpg`;
      const inputPath = image.path || path.join('uploads', image.filename);
      const outputPath = `uploads/${outputFileName}`;

      const result = await imageProcessingService.addBorder(inputPath, outputPath, {
        size,
        color
      });

      if (result.success) {
        const newImage = await Image.create({
          filename: outputFileName,
          originalName: `${image.originalName}_加边框`,
          path: outputPath,
          size: result.size,
          width: result.width,
          height: result.height,
          mimetype: 'image/jpeg',
          tags: [...(Array.isArray(image.tags) ? image.tags : []), '加边框'],
          source: 'processed',
          processType: 'background_added', // Reusing this type for now
          parentId: imageId
        });

        res.json({
          success: true,
          message: '边框添加成功',
          processedImage: newImage,
          result
        });
      } else {
        res.status(500).json({ error: '边框添加失败' });
      }
    } catch (error) {
      logger.error('边框添加控制器错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 批量处理
   */
  async batchProcess(req, res) {
    try {
      const { operation, imageIds, options = {} } = req.body;

      if (!operation || !imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: '参数错误' });
      }

      // 查找所有图片
      const images = await Image.findAll({
        where: { id: imageIds }
      });

      if (images.length === 0) {
        return res.status(404).json({ error: '未找到图片' });
      }

      // 准备批量处理数据
      const processData = images.map(image => {
        const outputFileName = `${path.parse(image.filename).name}_${operation}_${Date.now()}.${operation === 'removeBackground' ? 'png' : 'jpg'}`;
        const imagePath = image.path || path.join('uploads', image.filename);
        const outputPath = path.join(path.dirname(imagePath), outputFileName);
        
        return {
          id: image.id,
          inputPath: imagePath,
          outputPath,
          productPath: imagePath,
          scenePath: null // 批量处理暂不支持指定场景图
        };
      });

      // 执行批量处理
      const results = await imageProcessingService.batchProcess(processData, operation, options);

      // 处理成功的结果，创建新图片记录
      const successResults = results.filter(r => r.success);
      const newImages = [];

      for (const result of successResults) {
        const originalImage = images.find(img => img.id === result.imageId);
        if (originalImage) {
          const tags = [
            ...(Array.isArray(originalImage.tags) ? originalImage.tags : 
                typeof originalImage.tags === 'string' ? JSON.parse(originalImage.tags || '[]') : [])
          ];
          if (operation === 'removeBackground') {
            tags.push('去背景', '透明背景');
          } else if (operation === 'generateScene') {
            tags.push('AI场景', '智能生成');
          }

          const newImage = await Image.create({
            filename: path.basename(result.outputPath),
            originalName: `${originalImage.originalName}_${operation}`,
            path: result.outputPath,
            size: result.size,
            width: result.width,
            height: result.height,
            mimetype: operation === 'removeBackground' ? 'image/png' : 'image/jpeg',
            tags: tags,
            source: 'processed',
            processType: operation === 'removeBackground' ? 'background_removed' : 'background_added',
            parentId: originalImage.id
          });

          newImages.push(newImage);
        }
      }

      logger.info(`批量处理完成: ${operation}, 成功: ${successResults.length}, 失败: ${results.length - successResults.length}`);

      res.json({
        success: true,
        message: `批量处理完成`,
        total: results.length,
        successful: successResults.length,
        failed: results.length - successResults.length,
        results,
        newImages
      });

    } catch (error) {
      logger.error('批量处理控制器错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取处理历史
   */
  async getProcessHistory(req, res) {
    try {
      const { imageId } = req.params;

      // 查找原始图片和所有处理后的图片
      const processedImages = await Image.findAll({
        where: { parentId: imageId },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        history: processedImages
      });

    } catch (error) {
      logger.error('获取处理历史错误:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ImageProcessingController();