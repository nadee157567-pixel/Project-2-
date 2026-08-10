require('dotenv').config();
const pool = require('./src/config/database');

async function checkDuplicates() {
    try {
        const [rows] = await pool.query("SELECT cat_id, pet_name, created_at FROM cats WHERE pet_name = 'blue'");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkDuplicates();
