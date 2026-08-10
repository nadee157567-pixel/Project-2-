require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');
async function test() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM cats');
        console.log(rows.map(r => r.Field));
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
