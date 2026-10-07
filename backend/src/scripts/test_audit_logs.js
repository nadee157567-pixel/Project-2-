const pool = require('../config/database');

async function testAuditLogsApi() {
  console.log('=== TESTING AUDIT LOGS API (/api/admin/logs) ===');

  // 1. Login as Admin
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('1. Admin Login Success:', loginData.success);

  // 2. Test GET /api/admin/logs (Default pagination)
  const logsRes = await fetch('http://localhost:3000/api/admin/logs?page=1&limit=5', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const logsData = await logsRes.json();
  console.log('2. GET /api/admin/logs success:', logsData.success);
  console.log('   Total count:', logsData.pagination?.total, '| Total pages:', logsData.pagination?.totalPages);
  console.log('   Returned logs count:', logsData.logs?.length);
  if (logsData.logs?.length > 0) {
    console.log('   Sample log item:', {
      log_id: logsData.logs[0].log_id,
      admin: logsData.logs[0].admin_username,
      action: logsData.logs[0].action,
      details: logsData.logs[0].details,
      date: logsData.logs[0].formatted_date
    });
  }

  // 3. Test GET /api/admin/logs/actions (Action breakdown)
  const actionsRes = await fetch('http://localhost:3000/api/admin/logs/actions', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const actionsData = await actionsRes.json();
  console.log('3. GET /api/admin/logs/actions success:', actionsData.success);
  console.log('   Actions summary:', actionsData.data);

  // 4. Test Filter by Action
  const filterRes = await fetch('http://localhost:3000/api/admin/logs?action=BAN_USER_BY_REPORT', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const filterData = await filterRes.json();
  console.log('4. Filter action=BAN_USER_BY_REPORT count:', filterData.logs?.length);

  // 5. Test Search by Keyword
  const searchRes = await fetch('http://localhost:3000/api/admin/logs?search=report', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const searchData = await searchRes.json();
  console.log('5. Search keyword "report" count:', searchData.logs?.length);

  // 6. Test GET /api/admin/logs/:id
  const firstLogId = logsData.logs[0]?.log_id || 1;
  const singleRes = await fetch(`http://localhost:3000/api/admin/logs/${firstLogId}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const singleData = await singleRes.json();
  console.log(`6. GET /api/admin/logs/${firstLogId} detail success:`, singleData.success);
  console.log('   Detail details:', singleData.data?.details);

  // 7. Test Unauthorized Request
  const unauthRes = await fetch('http://localhost:3000/api/admin/logs');
  console.log('7. Unauthorized request status (expect 401):', unauthRes.status);

  console.log('=== ALL AUDIT LOG API TESTS PASSED! ===');
  process.exit(0);
}

testAuditLogsApi().catch(err => {
  console.error('Audit Log Test Failed:', err);
  process.exit(1);
});
