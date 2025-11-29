const { Image } = require('./src/models');

async function checkTags() {
  try {
    console.log('Checking image tags...');
    
    const images = await Image.findAll({
      where: { id: [14, 18] },
      attributes: ['id', 'filename', 'originalName', 'tags']
    });
    
    for (const img of images) {
      console.log('Image ID:', img.id);
      console.log('Filename:', img.filename);
      console.log('Original Name:', img.originalName);
      console.log('Tags:', img.tags);
      console.log('Tags Type:', typeof img.tags);
      console.log('Is Array:', Array.isArray(img.tags));
      console.log('---');
    }
    
    // Test update
    console.log('Testing tag update...');
    const testTags = ['test1', 'test2'];
    
    await Image.update(
      { tags: testTags },
      { where: { id: 18 } }
    );
    
    const updated = await Image.findByPk(18);
    console.log('Updated tags:', updated.tags);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkTags();