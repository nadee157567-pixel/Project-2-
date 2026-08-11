const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
    try {
        console.log("Connecting to MySQL to recreate the database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '151617',
            multipleStatements: true
        });

        console.log("Reading SQL file and importing data...");
        const sqlFilePath = path.join(__dirname, 'databaes2.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        await connection.query(sqlContent);
        
        console.log("Database import completed successfully!");
        
        await connection.end();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}
resetDatabase();
