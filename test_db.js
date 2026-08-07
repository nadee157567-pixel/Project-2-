require('dotenv').config();
const pool = require('./src/config/database');

async function checkDb() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);

    for (let i = 0; i < tables.length; i++) {
      const tableName = Object.values(tables[i])[0];
      const [desc] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`\nTable ${tableName}:`, desc);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDb();
