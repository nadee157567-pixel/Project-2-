const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function setupAdminLogs() {
  try {
    console.log('--- Setting up admin_logs table ---');

    // 1. Create table admin_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table admin_logs created or verified successfully.');

    // 2. Check Admin user & password
    const [admins] = await pool.query("SELECT user_id, username, password FROM users WHERE username = 'Admin'");
    if (admins.length > 0) {
      const match = await bcrypt.compare('admin123456', admins[0].password);
      if (!match) {
        console.log('Updating Admin password to admin123456...');
        const hash = await bcrypt.hash('admin123456', 10);
        await pool.query("UPDATE users SET password = ? WHERE user_id = ?", [hash, admins[0].user_id]);
        console.log('✓ Admin password updated to admin123456.');
      } else {
        console.log('✓ Admin password verified (admin123456).');
      }
    }

    // 3. Seed initial logs if table is empty
    const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM admin_logs');
    if (countRows[0].count === 0) {
      console.log('Seeding initial audit logs...');
      const sampleLogs = [
        {
          admin_id: 1,
          action: 'OVERRIDE_APPLICATION_STATUS',
          details: "เปลี่ยนสถานะคำขอ ID 2 (แมว ID 2) จาก 'approved' เป็น 'approved' เหตุผล: แอดมินยืนยันผลการพิจารณา",
          created_at: '2026-10-04 16:19:54'
        },
        {
          admin_id: 1,
          action: 'INSPECT_REPORT',
          details: 'Admin #1 started inspecting report #1',
          created_at: '2026-10-05 03:55:43'
        },
        {
          admin_id: 1,
          action: 'BAN_USER_BY_REPORT',
          details: 'Admin #1 banned user #3 from report #1. Reason: ละเมิดกฎร้ายแรง',
          created_at: '2026-10-05 03:55:43'
        },
        {
          admin_id: 1,
          action: 'INSPECT_REPORT',
          details: 'Admin #1 started inspecting report #3',
          created_at: '2026-10-05 04:04:05'
        },
        {
          admin_id: 1,
          action: 'UPDATE_CRITERIA',
          details: 'Admin #1 updated evaluation criteria ID 1',
          created_at: '2026-10-05 04:10:00'
        }
      ];

      for (const log of sampleLogs) {
        await pool.query(
          'INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, ?)',
          [log.admin_id, log.action, log.details, log.created_at]
        );
      }
      console.log('✓ Seeded', sampleLogs.length, 'sample audit logs.');
    } else {
      console.log(`ℹ admin_logs already contains ${countRows[0].count} records.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('setupAdminLogs error:', err);
    process.exit(1);
  }
}

setupAdminLogs();
