const fs = require('fs');
const path = require('path');
const { Settings } = require('../models'); // Assuming Settings model exists
const logger = require('../utils/logger');

class SettingsController {
  // Get all settings
  async getSettings(req, res) {
    try {
      // For now, we'll just return the Gemini API Key from process.env or DB
      // In a real app, we'd fetch from DB
      const geminiKey = process.env.GEMINI_API_KEY || '';
      
      res.json({
        success: true,
        data: {
          geminiApiKey: geminiKey
        }
      });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to get settings' });
    }
  }

  // Update settings
  async updateSettings(req, res) {
    try {
      const { geminiApiKey } = req.body;
      
      if (geminiApiKey !== undefined) {
        // 1. Update process.env
        process.env.GEMINI_API_KEY = geminiApiKey;
        
        // 2. Update .env file
        const envPath = path.join(__dirname, '../../.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Check if GEMINI_API_KEY exists
        if (envContent.includes('GEMINI_API_KEY=')) {
          // Replace existing
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiApiKey}`);
        } else {
          // Append new
          envContent += `\nGEMINI_API_KEY=${geminiApiKey}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        logger.info('Updated GEMINI_API_KEY in .env file');
      }

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }
}

module.exports = new SettingsController();
