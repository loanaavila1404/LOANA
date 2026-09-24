const fs = require('fs');
const content = fs.readFileSync('../erp-brusben/src/LogoData.html', 'utf-8');
const match = content.match(/data:image\/\w+;base64,([a-zA-Z0-9+/=]+)/);
if (match && match[1]) {
  fs.writeFileSync('public/logo.jpg', Buffer.from(match[1], 'base64'));
  console.log('Logo extracted successfully to public/logo.jpg');
} else {
  console.error('Base64 not found');
}
