require('dotenv').config();
const pool = require('./backend/src/config/database');

async function testQuery() {
    try {
        const [rows] = await pool.query('SELECT * FROM assessments');
        console.log("Assessments:", rows);
        const [apps] = await pool.query('SELECT * FROM adoptionapplications');
        console.log("Applications:", apps);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

testQuery();
