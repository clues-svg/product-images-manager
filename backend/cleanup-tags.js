const { sequelize, Tag, Image } = require('./src/models');
const { Op } = require('sequelize');

async function cleanupBadTags() {
  try {
    console.log('=== 清理损坏的标签数据 ===');
    
    // 1. 查看所有标签
    const allTags = await Tag.findAll();
    console.log('当前所有标签:');
    allTags.forEach(tag => {
      console.log('ID:', tag.id, 'Name:', JSON.stringify(tag.name), 'Length:', tag.name.length);
    });
    
    // 2. 删除名称包含问号或异常字符的标签
    const badTags = allTags.filter(tag => 
      tag.name.includes('?') || 
      tag.name.length < 2 ||
      tag.name === '???' ||
      tag.name === '????' ||
      tag.name === '??'
    );
    
    console.log('发现损坏标签:', badTags.length, '个');
    for (const tag of badTags) {
      console.log('删除标签:', tag.id, JSON.stringify(tag.name));
      await Tag.destroy({ where: { id: tag.id } });
    }
    
    // 3. 清理图片中的损坏标签
    const images = await Image.findAll({ 
      where: { 
        tags: { [Op.ne]: null } 
      } 
    });
    let updatedImages = 0;
    
    for (const image of images) {
      if (image.tags && Array.isArray(image.tags)) {
        const originalTags = image.tags;
        const cleanTags = image.tags.filter(tag => 
          tag && 
          !tag.includes('?') && 
          tag.length >= 2 &&
          tag !== '???' &&
          tag !== '????' &&
          tag !== '??'
        );
        
        if (cleanTags.length !== originalTags.length) {
          await Image.update(
            { tags: cleanTags },
            { where: { id: image.id } }
          );
          updatedImages++;
          console.log('清理图片', image.id, '标签:', originalTags, '->', cleanTags);
        }
      }
    }
    
    console.log('=== 清理完成 ===');
    console.log('删除损坏标签:', badTags.length, '个');
    console.log('更新图片:', updatedImages, '张');
    
    // 4. 显示清理后的标签列表
    const finalTags = await Tag.findAll();
    console.log('\n=== 清理后的标签列表 ===');
    finalTags.forEach(tag => {
      console.log('ID:', tag.id, 'Name:', tag.name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

cleanupBadTags();