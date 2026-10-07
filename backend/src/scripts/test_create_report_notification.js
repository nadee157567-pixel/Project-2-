const pool = require('../config/database');

async function testCreateReportNotification() {
  console.log('=== TESTING REAL-TIME REPORT NOTIFICATION CREATION ===');

  // Acquire admin token
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('1. Admin logged in, token acquired:', loginData.success);

  const postData = JSON.stringify({
    reported_user_id: 2,
    reason: 'พฤติกรรมไม่เหมาะสม / ส่งภาพไม่ตรงความจริง',
    details: 'ผู้ใช้นี้ลงประกาศเท็จและมีการใช้ถ้อยคำรุนแรงในข้อความ'
  });

  const reportRes = await fetch('http://localhost:3000/api/admin/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: postData
  });
  const reportData = await reportRes.json();
  console.log('2. Create Report response:', reportData);
}

testCreateReportNotification().catch(console.error);
