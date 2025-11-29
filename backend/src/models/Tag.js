const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '标签名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '标签描述'
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '#1890ff',
    comment: '标签颜色'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建者ID'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统标签'
  }
}, {
  tableName: 'tags',
  timestamps: true,
  underscored: false,
  comment: '标签表'
});

module.exports = Tag;