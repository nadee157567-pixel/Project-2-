require('dotenv').config();
const pool = require('./src/config/database');

async function fixPhotos() {
    try {
        const [rows] = await pool.query('SELECT photo_id, image_url FROM catphotos');
        let count = 0;
        for (const row of rows) {
            let url = row.image_url;
            if (url && !url.startsWith('http')) {
                let normalized = url.replace(/\\/g, '/');
                
                const fullUrl = `http://10.0.2.2:3000/${normalized}`;
                
                await pool.query('UPDATE catphotos SET image_url = ? WHERE photo_id = ?', [fullUrl, row.photo_id]);
                console.log(`Updated photo ${row.photo_id}: ${fullUrl}`);
                count++;
            }
        }
        console.log(`Successfully fixed ${count} photo records in the database.`);
    } catch (err) {
        console.error('Error fixing photos:', err);
    } finally {
        process.exit(0);
    }
}

fixPhotos();
