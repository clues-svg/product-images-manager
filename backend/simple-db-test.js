const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('pictures', 'pictures', 'YhcRzhcbkzdnRTHA', {
  host: '101.42.235.113',
  port: 3306,
  dialect: 'mysql',
  logging: console.log
});

console.log('测试数据库连接...');

sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    process.exit(0);
  })
  .catch(error => {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  });

// 10秒超时
setTimeout(() => {
  console.log('数据库连接超时');
  process.exit(1);
}, 10000);