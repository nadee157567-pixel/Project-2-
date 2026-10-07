const pool = require('../config/database');

async function fixChatTimestamps() {
  console.log('=== FIXING EXISTING CHAT MESSAGES TIMESTAMPS IN DATABASE ===');

  // Check count of messages before update
  const [beforeRows] = await pool.query('SELECT COUNT(*) AS total FROM messages');
  console.log('Total messages in DB:', beforeRows[0].total);

  // Update existing messages created with MySQL system GMT-7 offset by adding 7 hours
  const [result] = await pool.query(`
    UPDATE messages 
    SET sent_at = DATE_ADD(sent_at, INTERVAL 7 HOUR)
  `);

  console.log('Updated messages affected:', result.affectedRows);

  const [afterRows] = await pool.query('SELECT message_id, message_text, sent_at FROM messages ORDER BY message_id DESC LIMIT 5');
  console.log('Recent messages after timestamp fix:', afterRows);
}

fixChatTimestamps().catch(console.error);
