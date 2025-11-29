const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Minimal Server Running');
});

app.listen(port, () => {
  console.log(`最小化服务器运行在 http://localhost:${port}`);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});