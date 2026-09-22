const fs = require('fs');
const data = fs.readFileSync('c:/Users/loana/Documents/Codex/ERP BRUSBEN/ERP-Brusben-Fase-1/erp-brusben/src/LogoData.html', 'utf8');
const match = data.match(/data:image\/jpeg;base64,([\s\S]*?)(?:'|")/);
if (match) {
  fs.writeFileSync('c:/Users/loana/Documents/Codex/ERP BRUSBEN/ERP-Brusben-Fase-1/erp-brusben-web/public/logo.jpg', Buffer.from(match[1], 'base64'));
  console.log('Logo extracted');
} else {
  console.log('Logo not found');
}
