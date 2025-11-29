const Sequelize = require('sequelize');
console.log('Sequelize imported:', Sequelize);
console.log('Sequelize version:', Sequelize.version);

// 测试基础功能
console.log('Testing Sequelize.define:', typeof Sequelize.Sequelize.prototype.define);
console.log('Testing DataTypes:', Sequelize.DataTypes.STRING);

process.exit(0);