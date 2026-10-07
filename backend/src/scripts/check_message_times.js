const pool = require('../config/database');

async function checkMessageTimes() {
  console.log('=== CHECKING MESSAGES TIMESTAMP IN DB ===');
  const [rows] = await pool.query('SELECT message_id, room_id, sender_id, message_text, sent_at FROM messages ORDER BY message_id DESC LIMIT 10');
  console.log('Raw messages from DB:', rows);
}

checkMessageTimes().catch(console.error);
