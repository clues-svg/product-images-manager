const crawlerService = require('../services/crawlerService');
const logger = require('../utils/logger');
const { Image } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class CrawlerController {
  async crawl(req, res) {
    try {
      const { source, keyword, limit } = req.body;
      const userId = req.userId; // Assuming auth middleware sets this
      
      if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
      }

      logger.info(`Received crawl request: ${source}, ${keyword}`);

      let results;
      if (source === 'google') {
        results = await crawlerService.crawlGoogleImages(keyword, limit);
      } else {
        // Placeholder for other sources
        return res.status(400).json({ message: 'Unsupported source' });
      }

      // Save to database
      const savedImages = [];
      for (const item of results) {
        try {
          // Get image metadata (size, dimensions)
          const fullPath = path.join(__dirname, '../../', item.localPath);
          const stats = await fs.stat(fullPath);
          
          // Use sharp to get dimensions
          let width = 0;
          let height = 0;
          try {
            const metadata = await sharp(fullPath).metadata();
            width = metadata.width;
            height = metadata.height;
          } catch (sharpError) {
            logger.warn(`Failed to get image metadata for ${item.fileName}:`, sharpError);
            // Fallback or skip? For now, use dummy values if failed, but Image model requires min 1
            width = 800;
            height = 800;
          }
          
          const newImage = await Image.create({
            filename: item.fileName,
            originalName: `${keyword}_${path.basename(item.fileName)}`,
            path: item.localPath.startsWith('/') ? item.localPath.substring(1) : item.localPath, // Remove leading slash if present
            size: stats.size,
            mimetype: 'image/jpeg', // Assuming jpg for now as CrawlerService saves as .jpg
            source: 'crawler',
            sourceUrl: item.url,
            tags: [keyword, source],
            uploadedBy: userId || 1, // Default to admin if no user
            width: width,
            height: height
          });
          
          savedImages.push(newImage);
        } catch (dbError) {
          logger.error(`Failed to save image to DB: ${item.fileName}`, dbError);
        }
      }

      res.json({
        success: true,
        data: savedImages,
        count: savedImages.length,
        message: `Successfully crawled and saved ${savedImages.length} images`
      });

    } catch (error) {
      logger.error('Crawl controller error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Crawl failed', 
        error: error.message 
      });
    }
  }
}

module.exports = new CrawlerController();
