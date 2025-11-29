const { Image } = require('./src/models');
const { Op } = require('sequelize');

(async () => {
  try {
    console.log('=== 检查图片标签数据 ===');
    
    const images = await Image.findAll({
      where: { id: { [Op.in]: [14, 18] } },
      attributes: ['id', 'filename', 'originalName', 'tags']
    });
    
    images.forEach(img => {
      console.log(`图片${img.id}:`);
      console.log(`  filename: ${img.filename}`);
      console.log(`  originalName: ${img.originalName}`);
      console.log(`  tags: ${JSON.stringify(img.tags)}`);
      console.log(`  tags类型: ${typeof img.tags}`);
      console.log(`  是否为数组: ${Array.isArray(img.tags)}`);
      console.log('---');
    });
    
    // 测试更新一个图片的标签
    console.log('\n=== 测试更新图片18的标签 ===');
    const testTags = ['测试标签1', '测试标签2'];
    
    const [updatedRows] = await Image.update(
      { tags: testTags },
      { where: { id: 18 } }
    );
    
    console.log(`更新了 ${updatedRows} 行`);
    
    // 重新查询验证
    const updatedImage = await Image.findByPk(18);
    console.log('更新后的标签:', JSON.stringify(updatedImage.tags));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    process.exit(0);
  }
})();