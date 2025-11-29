const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { Image } = require('../models');
const path = require('path');
const fs = require('fs');

class AIController {
  async generateImage(req, res) {
    try {
      const { prompt, keyword, aspectRatio } = req.body;
      const referenceImage = req.file;
      const userId = req.userId;

      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      logger.info(`Received AI generation request: ${prompt}`);

      // Call AI Service
      const result = await aiService.generateImage({
        prompt,
        aspectRatio,
        referenceImagePath: referenceImage ? referenceImage.path : null
      });

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      // Save to database
      // Assuming result.localPath is relative to project root or uploads folder
      // We need to get file stats
      const fullPath = path.join(__dirname, '../../', result.localPath);
      let size = 0;
      try {
        const stats = fs.statSync(fullPath);
        size = stats.size;
      } catch (e) {
        logger.warn('Could not get file stats', e);
      }

      const newImage = await Image.create({
        filename: result.fileName,
        originalName: `AI_${keyword || 'generated'}_${Date.now()}.jpg`,
        path: result.localPath.startsWith('/') ? result.localPath.substring(1) : result.localPath,
        size: size,
        mimetype: 'image/jpeg',
        source: 'ai_generated',
        sourceUrl: null,
        tags: ['AI生成', keyword].filter(Boolean),
        uploadedBy: userId || 1,
        width: result.width || 1024,
        height: result.height || 1024,
        isProcessed: 0
      });

      // Clean up reference image if it exists
      if (referenceImage) {
        try {
          fs.unlinkSync(referenceImage.path);
        } catch (e) {
          logger.warn('Failed to delete temp reference image', e);
        }
      }

      res.json({
        success: true,
        image: {
          ...newImage.toJSON(),
          url: `/${newImage.path}`
        }
      });

    } catch (error) {
      logger.error('AI generation controller error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'AI generation failed', 
        error: error.message 
      });
    }
  }
}

module.exports = new AIController();
