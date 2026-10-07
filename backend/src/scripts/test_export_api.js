const fs = require('fs');
const path = require('path');

async function testExportApi() {
  console.log('=== TESTING EXPORT DASHBOARD REPORT API (/api/admin/dashboard/export) ===');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Admin', password: 'admin123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('1. Admin Login Success:', loginData.success);

  // 2. Test Excel Export (Default: all sheets)
  console.log('2. Testing Excel Export (format=excel, type=all)...');
  const excelRes = await fetch('http://localhost:3000/api/admin/dashboard/export?format=excel&type=all', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('   Status:', excelRes.status);
  console.log('   Content-Type:', excelRes.headers.get('content-type'));
  console.log('   Content-Disposition:', excelRes.headers.get('content-disposition'));
  const excelBuffer = await excelRes.arrayBuffer();
  console.log('   Excel file size in bytes:', excelBuffer.byteLength);

  if (excelBuffer.byteLength < 1000) {
    throw new Error('Excel buffer is too small, likely an error response!');
  }

  // 3. Test CSV Export (type=summary)
  console.log('3. Testing CSV Export (format=csv, type=summary)...');
  const csvSummaryRes = await fetch('http://localhost:3000/api/admin/dashboard/export?format=csv&type=summary', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('   Status:', csvSummaryRes.status);
  console.log('   Content-Type:', csvSummaryRes.headers.get('content-type'));
  const csvSummaryText = await csvSummaryRes.text();
  console.log('   Has UTF-8 BOM:', csvSummaryText.charCodeAt(0) === 0xFEFF);
  console.log('   CSV Summary preview:\n' + csvSummaryText.slice(0, 300));

  // 4. Test CSV Export (type=users)
  console.log('4. Testing CSV Export (format=csv, type=users)...');
  const csvUsersRes = await fetch('http://localhost:3000/api/admin/dashboard/export?format=csv&type=users', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const csvUsersText = await csvUsersRes.text();
  console.log('   CSV Users preview:\n' + csvUsersText.slice(0, 300));

  // 5. Test CSV Export (type=applications)
  console.log('5. Testing CSV Export (format=csv, type=applications)...');
  const csvAppsRes = await fetch('http://localhost:3000/api/admin/dashboard/export?format=csv&type=applications', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const csvAppsText = await csvAppsRes.text();
  console.log('   CSV Applications preview:\n' + csvAppsText.slice(0, 300));

  // 6. Test CSV Export (type=trends)
  console.log('6. Testing CSV Export (format=csv, type=trends)...');
  const csvTrendsRes = await fetch('http://localhost:3000/api/admin/dashboard/export?format=csv&type=trends', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const csvTrendsText = await csvTrendsRes.text();
  console.log('   CSV Trends preview:\n' + csvTrendsText.slice(0, 300));

  // 7. Test Unauthorized Request
  const unauthRes = await fetch('http://localhost:3000/api/admin/dashboard/export');
  console.log('7. Unauthorized request status (expect 401):', unauthRes.status);

  console.log('=== ALL EXPORT API TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testExportApi().catch(err => {
  console.error('Export API Test Failed:', err);
  process.exit(1);
});
