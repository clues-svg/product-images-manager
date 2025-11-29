console.log('开始调试服务器启动问题...');

try {
  console.log('1. 检查 express...');
  require('express');
  console.log('✓ express 正常');
} catch (e) {
  console.log('✗ express 错误:', e.message);
}

try {
  console.log('2. 检查 cors...');
  require('cors');
  console.log('✓ cors 正常');
} catch (e) {
  console.log('✗ cors 错误:', e.message);
}

try {
  console.log('3. 检查 helmet...');
  require('helmet');
  console.log('✓ helmet 正常');
} catch (e) {
  console.log('✗ helmet 错误:', e.message);
}

try {
  console.log('4. 检查 morgan...');
  require('morgan');
  console.log('✓ morgan 正常');
} catch (e) {
  console.log('✗ morgan 错误:', e.message);
}

try {
  console.log('5. 检查 sequelize...');
  require('sequelize');
  console.log('✓ sequelize 正常');
} catch (e) {
  console.log('✗ sequelize 错误:', e.message);
}

console.log('调试完成');