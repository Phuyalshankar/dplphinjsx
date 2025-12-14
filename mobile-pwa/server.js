
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MOBILE_DIR = './mobile-pwa';

const server = http.createServer((req, res) => {
  let filePath = path.join(MOBILE_DIR, req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(MOBILE_DIR, 'index.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('📱 Mobile PWA Server running at:');
  console.log('   Local:  http://localhost:' + PORT);
  console.log('   Network: http://' + require('os').networkInterfaces().eth0?.[0]?.address + ':' + PORT);
  console.log('\n📱 Open on Mobile:');
  console.log('   1. Connect phone to same WiFi');
  console.log('   2. Open browser on phone');
  console.log('   3. Go to the Network URL above');
  console.log('\n📱 Or scan QR code with phone camera');
});

// Generate QR code
const qrcode = require('qrcode-terminal');
const address = require('ip').address();
qrcode.generate('http://' + address + ':' + PORT);
