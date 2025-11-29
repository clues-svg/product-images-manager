const { sequelize } = require('../database/database');
const User = require('./User');
const Image = require('./Image');
const Tag = require('./Tag');

// 模型关联（如果有的话可以在这里添加）
// User.hasMany(OtherModel);

// 同步模型到数据库
async function syncModels() {
  try {
    // 在生产环境或已有数据库中，建议关闭 alter: true，避免意外修改表结构
    // await sequelize.sync({ alter: true });
    console.log('跳过自动同步模型 (使用现有数据库结构)');
  } catch (error) {
    console.error('数据库模型同步失败:', error);
  }
}

// 自动同步模型
syncModels();

module.exports = {
  sequelize,
  User,
  Image,
  Tag,
  syncModels
};