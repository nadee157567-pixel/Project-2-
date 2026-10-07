const pool = require('../config/database');

async function testBannedUserLogin() {
  console.log('=== TESTING BANNED USER LOGIN RESTRICTION ===');

  // Pick or create test user (user_id = 3 or test user)
  const [users] = await pool.query("SELECT user_id, username FROM users WHERE role = 'user' LIMIT 1");
  if (users.length === 0) {
    console.log('No test user found');
    return;
  }

  const testUser = users[0];
  console.log(`Target Test User: ID ${testUser.user_id} (${testUser.username})`);

  // Step 1: Ban user in database
  await pool.query(
    "UPDATE users SET is_banned = 1, ban_reason = 'ทดสอบการระงับบัญชีโดยระบบ' WHERE user_id = ?",
    [testUser.user_id]
  );
  console.log('1. Set is_banned = 1 for user', testUser.username);

  // Step 2: Attempt Login as banned user
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser.username, password: 'password123' })
  });

  const loginData = await loginRes.json();
  console.log('2. Banned User Login Response Status:', loginRes.status);
  console.log('   Response Body:', loginData);

  if (loginRes.status === 403 && loginData.is_banned) {
    console.log('✅ SUCCESS: Banned user login successfully blocked!');
  } else {
    console.error('❌ FAILED: Banned user was not blocked properly.');
  }

  // Step 3: Clean up - Unban test user
  await pool.query(
    "UPDATE users SET is_banned = 0, ban_reason = NULL WHERE user_id = ?",
    [testUser.user_id]
  );
  console.log('3. Restored user is_banned = 0');
}

testBannedUserLogin().catch(console.error);
