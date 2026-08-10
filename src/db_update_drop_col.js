require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');

async function run() {
    try {
        console.log("Starting DB update to drop est_monthly_cost...");
        
        try {
            await pool.query(`ALTER TABLE cats DROP COLUMN est_monthly_cost`);
            console.log("Successfully dropped est_monthly_cost from cats table.");
        } catch (e) {
            console.log("Error dropping est_monthly_cost (might already be dropped): " + e.message);
        }

        console.log("DB update completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Overall error:", error);
        process.exit(1);
    }
}

run();
