const pool = require('../config/database');

async function verifyReportsFullCycle() {
  console.log('=== VERIFYING REPORTS FULL CYCLE VIA API ===');
  
  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('1. Admin Login Success:', loginData.success);

  // 2. Fetch all reports
  const allRes = await fetch('http://localhost:3000/api/admin/reports', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const allData = await allRes.json();
  console.log('2. Fetch all reports count:', allData.reports.length);
  console.log('   Sample fields in response:', {
    id: allData.reports[0].id,
    report_id: allData.reports[0].report_id,
    username: allData.reports[0].username,
    issue: allData.reports[0].issue,
    status: allData.reports[0].status,
    date: allData.reports[0].date
  });

  // 3. Filter by Pending
  const pendingRes = await fetch('http://localhost:3000/api/admin/reports?status=Pending', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const pendingData = await pendingRes.json();
  console.log('3. Filter Pending count:', pendingData.reports.length);

  // 4. Detail of report #1
  const detailRes = await fetch('http://localhost:3000/api/admin/reports/1', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const detailData = await detailRes.json();
  console.log('4. Detail report #1:', {
    target_user: detailData.data.report.username,
    reporter: detailData.data.report.reported_by,
    issue: detailData.data.report.issue,
    evidence_count: detailData.data.evidence.length,
    cat_photos_count: detailData.data.cat_photos.length
  });

  // 5. Update status: inspect
  const inspectRes = await fetch('http://localhost:3000/api/admin/reports/1/update', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'inspect' })
  });
  const inspectData = await inspectRes.json();
  console.log('5. Inspect action response:', inspectData);

  // 6. Update status: ban
  const banRes = await fetch('http://localhost:3000/api/admin/reports/1/update', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ban', reason: 'ภาพลามกอนาจารและหลอกลวง' })
  });
  const banData = await banRes.json();
  console.log('6. Ban action response:', banData);

  // 7. Verify DB changes
  const [repInDb] = await pool.query('SELECT status, admin_note, handled_by FROM reports WHERE report_id = 1');
  const [targetUser] = await pool.query('SELECT user_id, username, is_banned, ban_reason FROM users WHERE user_id = 3');
  const [log] = await pool.query('SELECT * FROM admin_logs ORDER BY log_id DESC LIMIT 1');
  
  console.log('7. DB Verification:');
  console.log('   Report status in DB:', repInDb[0].status, '| Note:', repInDb[0].admin_note);
  console.log('   Target User is_banned:', targetUser[0].is_banned, '| Ban reason:', targetUser[0].ban_reason);
  console.log('   Admin Log entry:', log[0].action, '| Details:', log[0].details);

  // 8. Clean up test data for cleanliness
  await pool.query('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE user_id = 3');
  await pool.query("UPDATE reports SET status = 'Pending', admin_note = NULL WHERE report_id = 1");
  console.log('8. Test clean up completed successfully!');

  process.exit(0);
}

verifyReportsFullCycle().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
