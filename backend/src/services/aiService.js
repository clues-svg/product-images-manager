const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { GoogleGenAI } = require("@google/genai");

class AIService {
  constructor() {
    this.downloadPath = path.join(__dirname, '../../uploads/ai_generated');
    this.ensureDownloadDir();
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async generateImage({ prompt, aspectRatio, referenceImagePath }) {
    try {
      // Ensure API Key is loaded
      require('dotenv').config();
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API Key is not configured. Please set it in System Settings.');
      }

      logger.info(`Calling AI API with prompt: ${prompt}`);

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Prepare contents
      const contents = [{ text: prompt }];
      
      // If there is a reference image, read it and add to contents
      if (referenceImagePath && fs.existsSync(referenceImagePath)) {
        try {
            const imageData = fs.readFileSync(referenceImagePath);
            const base64Image = imageData.toString("base64");
            // Detect mime type roughly or default to png/jpeg
            const ext = path.extname(referenceImagePath).toLowerCase();
            let mimeType = "image/jpeg";
            if (ext === '.png') mimeType = "image/png";
            if (ext === '.webp') mimeType = "image/webp";
            
            contents.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            });
            logger.info(`Added reference image: ${referenceImagePath}`);
        } catch (err) {
            logger.warn(`Failed to read reference image: ${err.message}`);
        }
      }

      // Use the model requested by user: gemini-2.5-flash-image
      const modelName = "gemini-2.5-flash-image";
      
      logger.info(`Sending request to model: ${modelName}`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
            responseMimeType: "image/jpeg" // Requesting image output if supported by SDK config
        }
      });

      // Process response
      let base64Image = null;
      let mimeType = 'image/jpeg';
      let textOutput = '';

      if (response && response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                  if (part.inlineData) {
                      base64Image = part.inlineData.data;
                      mimeType = part.inlineData.mimeType || mimeType;
                      break; // Found image
                  } else if (part.text) {
                      textOutput += part.text;
                  }
              }
          }
      }

      if (!base64Image) {
          if (textOutput) {
              throw new Error(`Model returned text instead of image: ${textOutput.substring(0, 200)}...`);
          }
          throw new Error('No image data received from Gemini API.');
      }

      // Generate filename: sanitized_prompt_uuid.ext
      // Sanitize prompt: remove special chars, limit length
      const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `${sanitizedPrompt}_${uuidv4()}.${ext}`;
      const filepath = path.join(this.downloadPath, filename);
      
      const buffer = Buffer.from(base64Image, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      logger.info(`Image saved to: ${filepath}`);

      return {
        success: true,
        localPath: `/uploads/ai_generated/${filename}`,
        fileName: filename,
        width: 1024, 
        height: 1024
      };

    } catch (error) {
      logger.error('AI Service error:', error);
      // Return success: false so the controller knows it failed, but include the error message
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AIService();
