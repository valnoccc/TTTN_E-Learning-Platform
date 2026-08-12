const mysql = require('mysql2/promise');
async function fix() {
  const c = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', 
    port: 4000, 
    user: '3RAn3h6KN29y4p7.root', 
    password: 'h0xekLGgoqzstLim', 
    database: 'db_lvtn', 
    ssl: {rejectUnauthorized: true}
  });
  
  await c.execute('ALTER TABLE ThongBao MODIFY COLUMN LoaiThongBao ENUM("COURSE", "PAYMENT", "CERTIFICATE", "SYSTEM", "FORUM", "INTERACTION") DEFAULT "SYSTEM"');
  console.log("Updated enum in ThongBao");
  
  await c.end();
}
fix().catch(console.error);
