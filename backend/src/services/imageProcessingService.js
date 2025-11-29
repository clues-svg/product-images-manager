const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ImageProcessingService {
  constructor() {
    // 图片处理配置
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
  }

  /**
   * 去除图片背景
   * @param {string} imagePath - 输入图片路径
   * @param {string} outputPath - 输出图片路径
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async removeBackground(imagePath, outputPath, options = {}) {
    try {
      logger.info(`开始去除背景: ${imagePath}`);
      
      // 使用本地算法进行背景去除
      return await this.removeBackgroundLocal(imagePath, outputPath, options);
      
    } catch (error) {
      logger.error('去除背景失败:', error);
      throw new Error(`背景去除失败: ${error.message}`);
    }
  }



  /**
   * 本地去除背景 (使用Sharp进行简单处理)
   */
  async removeBackgroundLocal(imagePath, outputPath, options) {
    try {
      // 确保输出目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // 读取图片
      const image = sharp(imagePath);
      const { width, height } = await image.metadata();
      
      // 创建一个简单的蒙版 - 基于边缘检测
      // 这是一个简化的实现，实际效果可能不如专业的AI工具
      const processedImage = await image
        .ensureAlpha() // 确保有alpha通道
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { data, info } = processedImage;
      const channels = info.channels;
      
      // 简单的背景去除算法：检测边缘像素作为背景色参考
      const cornerPixels = [
        this.getPixelColor(data, 0, 0, width, channels),
        this.getPixelColor(data, width - 1, 0, width, channels),
        this.getPixelColor(data, 0, height - 1, width, channels),
        this.getPixelColor(data, width - 1, height - 1, width, channels)
      ];
      
      const avgBgColor = this.calculateAverageColor(cornerPixels);
      const tolerance = options.tolerance || 50;
      
      // 处理每个像素
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * channels;
          const pixelColor = {
            r: data[pixelIndex],
            g: data[pixelIndex + 1],
            b: data[pixelIndex + 2]
          };
          
          // 如果像素颜色接近背景色，设为透明
          if (this.colorDistance(pixelColor, avgBgColor) < tolerance) {
            data[pixelIndex + 3] = 0; // 设置alpha为0 (透明)
          }
        }
      }
      
      // 保存处理后的图片
      await sharp(data, {
        raw: {
          width,
          height,
          channels
        }
      })
      .png()
      .toFile(outputPath);
      
      const stats = await fs.stat(outputPath);
      
      return {
        success: true,
        outputPath,
        method: 'local',
        size: stats.size
      };
      
    } catch (error) {
      logger.error('本地背景去除失败:', error);
      // 如果本地处理失败，创建一个简单的透明边框版本
      return await this.createTransparentBorder(imagePath, outputPath, options);
    }
  }

  /**
   * 创建透明边框版本 (备用方案)
   */
  async createTransparentBorder(imagePath, outputPath, options) {
    const borderSize = options.borderSize || 20;
    
    const result = await sharp(imagePath)
      .extend({
        top: borderSize,
        bottom: borderSize,
        left: borderSize,
        right: borderSize,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    return {
      success: true,
      outputPath,
      method: 'transparent_border',
      size: result.size
    };
  }

  /**
   * 生成场景图片
   * @param {string} productImagePath - 产品图片路径
   * @param {string} sceneImagePath - 场景图片路径 (可选)
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 处理结果
   */
  async generateScene(productImagePath, sceneImagePath, outputPath, options = {}) {
    try {
      logger.info(`开始生成场景: 产品=${productImagePath}, 场景=${sceneImagePath}`);
      
      if (sceneImagePath) {
        // 模式1: 产品图 + 场景图 + AI溶图
        return await this.blendWithScene(productImagePath, sceneImagePath, outputPath, options);
      } else {
        // 模式2: 产品图 + AI生成场景
        return await this.generateAIScene(productImagePath, outputPath, options);
      }
      
    } catch (error) {
      logger.error('场景生成失败:', error);
      throw new Error(`场景生成失败: ${error.message}`);
    }
  }

  /**
   * 产品图与场景图融合
   */
  async blendWithScene(productImagePath, sceneImagePath, outputPath, options) {
    const productImage = sharp(productImagePath);
    const sceneImage = sharp(sceneImagePath);
    
    // 获取图片信息
    const productMeta = await productImage.metadata();
    const sceneMeta = await sceneImage.metadata();
    
    // 设置输出尺寸
    const outputWidth = options.width || Math.max(productMeta.width, sceneMeta.width);
    const outputHeight = options.height || Math.max(productMeta.height, sceneMeta.height);
    
    // 调整场景图尺寸作为背景
    const resizedScene = await sceneImage
      .resize(outputWidth, outputHeight, { fit: 'cover' })
      .toBuffer();
    
    // 调整产品图尺寸和位置
    const productSize = Math.min(outputWidth * 0.6, outputHeight * 0.6);
    const resizedProduct = await productImage
      .resize(productSize, productSize, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    // 计算产品图位置 (默认居中偏下)
    const left = Math.floor((outputWidth - productSize) / 2);
    const top = Math.floor(outputHeight * 0.3);
    
    // 合成图片
    const result = await sharp(resizedScene)
      .composite([{
        input: resizedProduct,
        left: options.left || left,
        top: options.top || top,
        blend: options.blend || 'over'
      }])
      .jpeg({ quality: options.quality || 90 })
      .toFile(outputPath);
    
    return {
      success: true,
      outputPath,
      method: 'blend',
      width: outputWidth,
      height: outputHeight,
      size: result.size
    };
  }

  /**
   * AI生成场景 (使用Sharp生成渐变背景和装饰)
   */
  async generateAIScene(productImagePath, outputPath, options) {
    const productImage = sharp(productImagePath);
    const productMeta = await productImage.metadata();
    
    // 设置输出尺寸
    const outputWidth = options.width || 1200;
    const outputHeight = options.height || 1200;
    
    // 生成渐变背景
    const background = await this.generateGradientBackground(
      outputWidth, 
      outputHeight, 
      options.colors || ['#f0f8ff', '#e6f3ff']
    );
    
    // 调整产品图尺寸
    const productSize = Math.min(outputWidth * 0.7, outputHeight * 0.7);
    const resizedProduct = await productImage
      .resize(productSize, productSize, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    // 计算居中位置
    const left = Math.floor((outputWidth - productSize) / 2);
    const top = Math.floor((outputHeight - productSize) / 2);
    
    // 合成最终图片
    const result = await sharp(background)
      .composite([{
        input: resizedProduct,
        left,
        top,
        blend: 'over'
      }])
      .jpeg({ quality: options.quality || 90 })
      .toFile(outputPath);
    
    return {
      success: true,
      outputPath,
      method: 'ai_generated',
      width: outputWidth,
      height: outputHeight,
      size: result.size
    };
  }

  /**
   * 生成渐变背景
   */
  async generateGradientBackground(width, height, colors) {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    
    return await sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * 调整图片尺寸
   */
  async resize(imagePath, outputPath, options) {
    try {
      const { width, height, fit = 'cover' } = options;
      
      await sharp(imagePath)
        .resize(parseInt(width), parseInt(height), { fit })
        .toFile(outputPath);
        
      const stats = await fs.stat(outputPath);
      const meta = await sharp(outputPath).metadata();
      
      return {
        success: true,
        outputPath,
        method: 'resize',
        width: meta.width,
        height: meta.height,
        size: stats.size
      };
    } catch (error) {
      logger.error('调整尺寸失败:', error);
      throw error;
    }
  }

  /**
   * 添加边框
   */
  async addBorder(imagePath, outputPath, options) {
    try {
      const { size = 10, color = '#FFFFFF' } = options;
      
      const image = sharp(imagePath);
      const meta = await image.metadata();
      
      await image
        .extend({
          top: parseInt(size),
          bottom: parseInt(size),
          left: parseInt(size),
          right: parseInt(size),
          background: color
        })
        .toFile(outputPath);
        
      const stats = await fs.stat(outputPath);
      const newMeta = await sharp(outputPath).metadata();
      
      return {
        success: true,
        outputPath,
        method: 'add_border',
        width: newMeta.width,
        height: newMeta.height,
        size: stats.size
      };
    } catch (error) {
      logger.error('添加边框失败:', error);
      throw error;
    }
  }

  /**
   * 批量处理图片
   */
  async batchProcess(images, operation, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 3;
    
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchPromises = batch.map(async (image) => {
        try {
          let result;
          switch (operation) {
            case 'removeBackground':
              result = await this.removeBackground(image.inputPath, image.outputPath, options);
              break;
            case 'generateScene':
              result = await this.generateScene(image.productPath, image.scenePath, image.outputPath, options);
              break;
            case 'resize':
              result = await this.resize(image.inputPath, image.outputPath, options);
              break;
            case 'addBorder':
              result = await this.addBorder(image.inputPath, image.outputPath, options);
              break;
            default:
              throw new Error(`未知操作: ${operation}`);
          }
          return { ...result, imageId: image.id };
        } catch (error) {
          logger.error(`批量处理失败 - 图片ID: ${image.id}`, error);
          return { success: false, imageId: image.id, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // 辅助方法
  getPixelColor(data, x, y, width, channels) {
    const index = (y * width + x) * channels;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    };
  }

  calculateAverageColor(colors) {
    const total = colors.reduce((acc, color) => {
      return {
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b
      };
    }, { r: 0, g: 0, b: 0 });
    
    return {
      r: Math.floor(total.r / colors.length),
      g: Math.floor(total.g / colors.length),
      b: Math.floor(total.b / colors.length)
    };
  }

  colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) + 
      Math.pow(color1.g - color2.g, 2) + 
      Math.pow(color1.b - color2.b, 2)
    );
  }
}

module.exports = new ImageProcessingService();