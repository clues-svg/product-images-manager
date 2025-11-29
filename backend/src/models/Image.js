const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '原始文件名'
  },
  source: {
    type: DataTypes.ENUM('upload', 'ai_generated', 'crawler', 'processed'),
    allowNull: false,
    defaultValue: 'upload',
    comment: '图片来源：上传/AI生成/爬虫/处理'
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '爬虫来源网站URL'
  },
  processType: {
    type: DataTypes.ENUM('original', 'background_removed', 'background_added', 'resized'),
    allowNull: false,
    defaultValue: 'original',
    comment: '处理类型：原始/背景移除/场景添加/尺寸调整'
  },
  parentImageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父图片ID（用于处理后的图片）'
  },
  aiModel: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'AI生成模型：DALL-E/Midjourney/Stable Diffusion等'
  },
  aspectRatio: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: '宽高比：width/height'
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^uploads\/[a-zA-Z0-9\-_\u4e00-\u9fa5]+\.(jpg|jpeg|png|gif|webp)$/i
    }
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10 * 1024 * 1024 // 10MB
    }
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['image/jpeg', 'image/png', 'image/gif', 'image/webp']]
    }
  },
  width: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  height: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('必须是数组');
        }
      }
    }
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'images',
  timestamps: true,
  paranoid: false
});

module.exports = Image;