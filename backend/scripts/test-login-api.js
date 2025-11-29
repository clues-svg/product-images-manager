const http = require('http');

const data = JSON.stringify({
  email: 'admin@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY: ' + body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  console.error(e);
});

// Write data to request body
req.write(data);
req.end();