require('dotenv').config();
const pool = require('./src/config/database');

async function migrate() {
    try {
        console.log("1. Modifying req_attention to VARCHAR(50) temporarily...");
        await pool.query("ALTER TABLE cats MODIFY COLUMN req_attention VARCHAR(50)");

        console.log("2. Mapping old values ('small' -> 'low', 'large' -> 'high')...");
        await pool.query("UPDATE cats SET req_attention = 'low' WHERE req_attention = 'small'");
        await pool.query("UPDATE cats SET req_attention = 'high' WHERE req_attention = 'large'");

        console.log("3. Modifying req_attention to ENUM('low', 'medium', 'high')...");
        await pool.query("ALTER TABLE cats MODIFY COLUMN req_attention ENUM('low', 'medium', 'high')");

        console.log("Migration successful!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
