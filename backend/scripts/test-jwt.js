const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

function testJwt() {
  try {
    console.log('Config JWT Secret:', config.jwt.secret);
    console.log('Config JWT ExpiresIn:', config.jwt.expiresIn);

    const payload = { userId: 1 };
    console.log('Signing token with payload:', payload);

    const token = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    console.log('Token generated successfully:', token);
  } catch (error) {
    console.error('Error generating token:', error);
  }
}

testJwt();