const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API基础URL
const BASE_URL = 'http://localhost:3001/api/v1';

// 测试结果存储
const testResults = [];

// 日志函数
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// 测试函数
async function runTest(testName, testFn) {
  try {
    log(`开始测试: ${testName}`);
    const result = await testFn();
    testResults.push({ name: testName, status: 'PASS', result });
    log(`✅ ${testName} - 通过`);
    return result;
  } catch (error) {
    testResults.push({ name: testName, status: 'FAIL', error: error.message });
    log(`❌ ${testName} - 失败: ${error.message}`);
    return null;
  }
}

// 1. 测试健康检查
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  return response.data;
}

// 2. 测试用户注册
async function testUserRegister() {
  const userData = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    confirmPassword: 'testpassword123'
  };
  
  const response = await axios.post(`${BASE_URL}/auth/register`, userData);
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`注册失败，状态码: ${response.status}`);
  }
  return { userData, response: response.data };
}

// 3. 测试用户登录
async function testUserLogin(userData) {
  const loginData = {
    username: userData.username,
    password: userData.password
  };
  
  const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
  if (response.status !== 200) {
    throw new Error(`登录失败，状态码: ${response.status}`);
  }
  
  if (!response.data.data || !response.data.data.token) {
    throw new Error('登录响应中缺少token');
  }
  
  return response.data.data.token;
}

// 4. 测试获取用户信息
async function testGetUserInfo(token) {
  const response = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.status !== 200) {
    throw new Error(`获取用户信息失败，状态码: ${response.status}`);
  }
  
  return response.data;
}

// 5. 测试图片上传
async function testImageUpload(token) {
  // 创建测试图片文件
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  
  // 如果测试图片不存在，创建一个简单的测试文件
  if (!fs.existsSync(testImagePath)) {
    // 创建一个简单的测试文件（实际项目中应该使用真实图片）
    fs.writeFileSync(testImagePath, 'fake image data for testing');
  }
  
  const formData = new FormData();
  formData.append('image', fs.createReadStream(testImagePath));
  formData.append('tags', JSON.stringify(['测试', '上传']));
  
  const response = await axios.post(`${BASE_URL}/images`, formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${token}`
    }
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`图片上传失败，状态码: ${response.status}`);
  }
  
  return response.data.data;
}

// 6. 测试获取图片列表
async function testGetImageList() {
  const response = await axios.get(`${BASE_URL}/images`);
  
  if (response.status !== 200) {
    throw new Error(`获取图片列表失败，状态码: ${response.status}`);
  }
  
  return response.data;
}

// 7. 测试获取单张图片
async function testGetSingleImage(imageId) {
  const response = await axios.get(`${BASE_URL}/images/${imageId}`, {
    headers: { Accept: 'application/json' }
  });
  
  if (response.status !== 200) {
    throw new Error(`获取图片详情失败，状态码: ${response.status}`);
  }
  
  return response.data;
}

// 8. 测试更新图片信息
async function testUpdateImage(imageId, token) {
  const updateData = {
    tags: ['更新测试', '修改标签']
  };
  
  const response = await axios.put(`${BASE_URL}/images/${imageId}`, updateData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.status !== 200) {
    throw new Error(`更新图片失败，状态码: ${response.status}`);
  }
  
  return response.data;
}

// 9. 测试删除图片
async function testDeleteImage(imageId, token) {
  const response = await axios.delete(`${BASE_URL}/images/${imageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.status !== 200) {
    throw new Error(`删除图片失败，状态码: ${response.status}`);
  }
  
  return response.data;
}

// 主测试函数
async function runAllTests() {
  log('开始API测试');
  log('='.repeat(50));
  
  let token = null;
  let userData = null;
  let uploadedImage = null;
  
  // 1. 健康检查
  await runTest('健康检查', testHealthCheck);
  
  // 2. 用户注册
  const registerResult = await runTest('用户注册', testUserRegister);
  if (registerResult) {
    userData = registerResult.userData;
  }
  
  // 3. 用户登录
  if (userData) {
    token = await runTest('用户登录', () => testUserLogin(userData));
  }
  
  // 4. 获取用户信息
  if (token) {
    await runTest('获取用户信息', () => testGetUserInfo(token));
  }
  
  // 5. 图片上传
  if (token) {
    uploadedImage = await runTest('图片上传', () => testImageUpload(token));
  }
  
  // 6. 获取图片列表
  await runTest('获取图片列表', testGetImageList);
  
  // 7. 获取单张图片
  if (uploadedImage) {
    await runTest('获取单张图片', () => testGetSingleImage(uploadedImage.id));
  }
  
  // 8. 更新图片信息
  if (uploadedImage && token) {
    await runTest('更新图片信息', () => testUpdateImage(uploadedImage.id, token));
  }
  
  // 9. 删除图片
  if (uploadedImage && token) {
    await runTest('删除图片', () => testDeleteImage(uploadedImage.id, token));
  }
  
  // 输出测试结果
  log('='.repeat(50));
  log('测试结果汇总:');
  
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    log(`${status} ${result.name}`);
    if (result.status === 'FAIL') {
      log(`   错误: ${result.error}`);
    }
  });
  
  log(`\n总计: ${testResults.length} 个测试`);
  log(`通过: ${passCount} 个`);
  log(`失败: ${failCount} 个`);
  log(`成功率: ${((passCount / testResults.length) * 100).toFixed(1)}%`);
  
  // 清理测试文件
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
    log('清理测试文件完成');
  }
}

// 检查服务器是否运行
async function checkServerStatus() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// 启动测试
async function main() {
  log('检查服务器状态...');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    log('❌ 服务器未运行，请先启动服务器: npm run dev');
    process.exit(1);
  }
  
  log('✅ 服务器正在运行，开始测试');
  await runAllTests();
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    log('测试执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  checkServerStatus
};