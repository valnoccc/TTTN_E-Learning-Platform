const fs = require('fs');
const https = require('https');
const path = require('path');

const BANKS = ['VCB', 'TCB', 'MB', 'CTG', 'BIDV', 'ACB'];
const dir = path.join(__dirname, 'public', 'assets', 'images', 'banks');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

BANKS.forEach(bank => {
  const url = `https://api.vietqr.io/img/${bank}.png`;
  const dest = path.join(dir, `${bank}.png`);
  const file = fs.createWriteStream(dest);

  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(() => console.log(`Downloaded ${bank}.png`));
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${bank}.png:`, err.message);
  });
});
