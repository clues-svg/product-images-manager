const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CrawlerService {
  constructor() {
    this.browser = null;
    this.downloadPath = path.join(__dirname, '../../uploads/crawler');
    this.ensureDownloadDir();
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Crawl images from Google Images (Basic Implementation)
   * @param {string} keyword 
   * @param {number} limit 
   */
  async crawlGoogleImages(keyword, limit = 20) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    let results = [];

    try {
      logger.info(`Starting crawl for keyword: ${keyword}`);
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`, {
        waitUntil: 'networkidle2'
      });

      // Scroll to load more images
      await this.autoScroll(page);

      // Extract image URLs
      // Note: Google's selectors change often. This is a best-effort selector.
      const imageUrls = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .map(img => img.src || img.dataset.src)
          .filter(src => src && src.startsWith('http'))
          .slice(0, 100); // Get more candidates first
      });

      logger.info(`Found ${imageUrls.length} candidate images`);

      // Download images in parallel
      // Take more candidates than limit to account for failures
      const candidates = imageUrls.slice(0, limit + 5);
      
      const downloadPromises = candidates.map(async (url) => {
        try {
          const filename = `${uuidv4()}.jpg`;
          const filepath = path.join(this.downloadPath, filename);
          
          logger.info(`Downloading image to: ${filepath}`);
          await this.downloadImage(url, filepath);
          
          return {
            url: url,
            localPath: `/uploads/crawler/${filename}`,
            fileName: filename,
            source: 'google'
          };
        } catch (err) {
          logger.warn(`Failed to download image ${url}: ${err.message}`);
          return null;
        }
      });

      const downloadResults = await Promise.all(downloadPromises);
      
      // Filter out failed downloads and limit the result count
      results = downloadResults.filter(item => item !== null).slice(0, limit);

    } catch (error) {
      logger.error('Crawl failed:', error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }

  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 5000) { // Limit scroll
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async downloadImage(url, filepath) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

module.exports = new CrawlerService();
