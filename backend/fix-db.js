const mysql = require('mysql2/promise');
async function fix() {
  const c = await mysql.createConnection({host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', port: 4000, user: '3RAn3h6KN29y4p7.root', password: 'h0xekLGgoqzstLim', database: 'db_lvtn', ssl: {rejectUnauthorized: true}});
  
  await c.execute('ALTER TABLE BaiViet ADD COLUMN IsPinned BOOLEAN DEFAULT FALSE');
  console.log("Added IsPinned column");
  
  await c.end();
}
fix().catch(console.error);
