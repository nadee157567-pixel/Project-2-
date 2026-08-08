require('dotenv').config();
const pool = require('./backend/src/config/database');

async function updateDb() {
    try {
        // 1. Update all existing 'poster' to 'user'
        const [updateResult] = await pool.query(`UPDATE users SET role = 'user' WHERE role = 'poster'`);
        console.log(`Updated ${updateResult.affectedRows} users from 'poster' to 'user'.`);
        
        // 2. Modify ENUM
        await pool.query(`ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'`);
        console.log('Successfully altered users table role ENUM.');

    } catch (error) {
        console.error('Error updating DB:', error);
    } finally {
        process.exit(0);
    }
}

updateDb();
