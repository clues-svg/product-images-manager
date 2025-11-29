const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const API_BASE = '/api/v1';

// 测试结果
const results = [];

// 日志函数
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// HTTP请求函数
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// 测试函数
async function runTest(testName, testFn) {
  try {
    log(`开始测试: ${testName}`);
    const result = await testFn();
    results.push({ name: testName, status: 'PASS', result });
    log(`✅ ${testName} - 通过`);
    return result;
  } catch (error) {
    results.push({ name: testName, status: 'FAIL', error: error.message });
    log(`❌ ${testName} - 失败: ${error.message}`);
    return null;
  }
}

// 1. 测试健康检查
async function testHealthCheck() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/health`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options);
  if (response.statusCode !== 200) {
    throw new Error(`期望状态码200，实际${response.statusCode}`);
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
  
  const postData = JSON.stringify(userData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/auth/register`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const response = await makeRequest(options, postData);
  if (response.statusCode !== 201 && response.statusCode !== 200) {
    throw new Error(`注册失败，状态码: ${response.statusCode}, 响应: ${JSON.stringify(response.data)}`);
  }
  
  return { userData, response: response.data };
}

// 3. 测试用户登录
async function testUserLogin(userData) {
  const loginData = {
    username: userData.username,
    password: userData.password
  };
  
  const postData = JSON.stringify(loginData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const response = await makeRequest(options, postData);
  if (response.statusCode !== 200) {
    throw new Error(`登录失败，状态码: ${response.statusCode}, 响应: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.data || !response.data.data.token) {
    throw new Error('登录响应中缺少token');
  }
  
  return response.data.data.token;
}

// 4. 测试获取用户信息
async function testGetUserInfo(token) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/auth/me`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const response = await makeRequest(options);
  if (response.statusCode !== 200) {
    throw new Error(`获取用户信息失败，状态码: ${response.statusCode}`);
  }
  
  return response.data;
}

// 5. 测试获取图片列表
async function testGetImageList() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/images`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options);
  if (response.statusCode !== 200) {
    throw new Error(`获取图片列表失败，状态码: ${response.statusCode}`);
  }
  
  return response.data;
}

// 6. 测试图片上传（简化版，不实际上传文件）
async function testImageUploadEndpoint(token) {
  // 这里我们只测试端点是否存在，不实际上传文件
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/images`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  const response = await makeRequest(options);
  // 期望400错误，因为没有文件
  if (response.statusCode !== 400) {
    throw new Error(`期望状态码400（缺少文件），实际${response.statusCode}`);
  }
  
  return response.data;
}

// 主测试函数
async function runAllTests() {
  log('开始API测试');
  log('='.repeat(50));
  
  let token = null;
  let userData = null;
  
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
  
  // 5. 获取图片列表
  await runTest('获取图片列表', testGetImageList);
  
  // 6. 测试图片上传端点
  if (token) {
    await runTest('图片上传端点测试', () => testImageUploadEndpoint(token));
  }
  
  // 输出测试结果
  log('='.repeat(50));
  log('测试结果汇总:');
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    log(`${status} ${result.name}`);
    if (result.status === 'FAIL') {
      log(`   错误: ${result.error}`);
    }
  });
  
  log(`\n总计: ${results.length} 个测试`);
  log(`通过: ${passCount} 个`);
  log(`失败: ${failCount} 个`);
  log(`成功率: ${((passCount / results.length) * 100).toFixed(1)}%`);
}

// 检查服务器状态
async function checkServerStatus() {
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `${API_BASE}/health`,
      method: 'GET',
      timeout: 5000
    };
    
    await makeRequest(options);
    return true;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  log('检查服务器状态...');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    log('❌ 服务器未运行，请先启动测试服务器: node src/test-server.js');
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