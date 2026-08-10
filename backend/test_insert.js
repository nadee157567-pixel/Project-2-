require('dotenv').config();
const pool = require('./src/config/database');

async function testInsert() {
    try {
        const [result] = await pool.query(`
            INSERT INTO cats 
            (poster_id, pet_name, pet_breed, gender, age_months, is_sterilized, is_vaccinated, health_note, req_space_level, req_attention, personality, est_monthly_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            4, // a valid user_id
            'test',
            'test_breed',
            'male',
            12,
            '1',
            '1',
            '',
            'medium',
            'medium',
            null,
            3000
        ]);
        console.log('Insert successful:', result.insertId);
    } catch (err) {
        console.error('Insert failed:', err);
    } finally {
        process.exit(0);
    }
}
testInsert();
