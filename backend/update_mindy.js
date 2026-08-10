require('dotenv').config();
const pool = require('./src/config/database');

(async () => {
    const [upd] = await pool.query(
        "UPDATE cats SET status = 'pending' WHERE pet_name = 'mindy' AND status = 'available'"
    );
    console.log('Updated rows:', upd.affectedRows);

    const [cats] = await pool.query(
        "SELECT cat_id, pet_name, status FROM cats WHERE pet_name IN ('mindy', 'sasa')"
    );
    console.log('Cat statuses:', JSON.stringify(cats, null, 2));
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
