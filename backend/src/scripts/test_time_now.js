const pool = require('../config/database');

async function testFixTimezone() {
  console.log('=== TESTING TIMEZONE FIX ===');
  
  // Set session timezone for MySQL connections to UTC (+00:00) or Thailand (+07:00)
  await pool.query("SET time_zone = '+00:00'");
  const [r1] = await pool.query('SELECT NOW() AS now_utc, UTC_TIMESTAMP() AS utc_now');
  console.log('After SET time_zone = "+00:00":');
  console.log('  NOW():', r1[0].now_utc);
  console.log('  JS Date ISO:', new Date().toISOString());

  // Test inserting with explicit JS Date vs NOW()
  const jsDate = new Date();
  console.log('JS Date object:', jsDate);
}

testFixTimezone().catch(console.error);
