const pool = require('../config/database');
const adminReportController = require('../controllers/adminReportController');

async function runTests() {
  console.log('--- Testing adminReportController ---');

  // Mock res helper
  const createMockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  // 1. Test getReports
  console.log('1. Testing getReports...');
  const req1 = { query: {} };
  const res1 = createMockRes();
  await adminReportController.getReports(req1, res1);
  console.log('getReports status:', res1.statusCode || 200);
  console.log('getReports count:', res1.jsonData?.reports?.length);
  console.log('Sample report:', res1.jsonData?.reports?.[0]);

  // 2. Test getReports with filter
  console.log('2. Testing getReports with ?status=Pending...');
  const req2 = { query: { status: 'Pending' } };
  const res2 = createMockRes();
  await adminReportController.getReports(req2, res2);
  console.log('Pending count:', res2.jsonData?.reports?.length);

  // 3. Test getReportDetail
  console.log('3. Testing getReportDetail...');
  const req3 = { params: { id: 1 } };
  const res3 = createMockRes();
  await adminReportController.getReportDetail(req3, res3);
  console.log('getReportDetail success:', res3.jsonData?.success);
  console.log('Report Detail:', res3.jsonData?.data?.report?.reason, 'Target user:', res3.jsonData?.data?.report?.username);
  console.log('Evidence count:', res3.jsonData?.data?.evidence?.length);

  // 4. Test updateReportStatus with inspect
  console.log('4. Testing updateReportStatus action=inspect...');
  const req4 = {
    params: { id: 1 },
    body: { action: 'inspect' },
    user: { user_id: 1, role: 'admin' }
  };
  const res4 = createMockRes();
  await adminReportController.updateReportStatus(req4, res4);
  console.log('update inspect result:', res4.jsonData);

  // 5. Test updateReportStatus with ban
  console.log('5. Testing updateReportStatus action=ban...');
  const req5 = {
    params: { id: 1 },
    body: { action: 'ban', reason: 'ละเมิดกฎร้ายแรง' },
    user: { user_id: 1, role: 'admin' }
  };
  const res5 = createMockRes();
  await adminReportController.updateReportStatus(req5, res5);
  console.log('update ban result:', res5.jsonData);

  // Check target user ban status and admin_logs
  const [users] = await pool.query('SELECT user_id, username, is_banned, ban_reason FROM users WHERE user_id = 3');
  console.log('Target user in DB:', users[0]);

  const [logs] = await pool.query('SELECT * FROM admin_logs ORDER BY log_id DESC LIMIT 2');
  console.log('Recent admin_logs:', logs);

  // Revert user 3 ban for testing cleanliness
  await pool.query('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE user_id = 3');
  await pool.query('UPDATE reports SET status = "Pending", admin_note = NULL WHERE report_id = 1');
  console.log('✓ Cleaned up test data state.');

  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
