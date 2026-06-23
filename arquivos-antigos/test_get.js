const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTM4LCJzdWIiOjEzOCwibG9naW4iOiIwNzc5MTAzMDQxMSIsImlhdCI6MTc4MjA3MDM3M30.CAYrYmVS3lJPLB6GtQn_r7e1oeWMvnG3dsgVlsOMEvw';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/equipamentos',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});

req.end();
