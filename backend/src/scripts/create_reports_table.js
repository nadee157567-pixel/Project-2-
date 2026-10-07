const pool = require('../config/database');

async function createReportsTable() {
  try {
    console.log('--- Creating reports and report_images tables ---');

    // 1. Create reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        reported_user_id INT NULL,
        cat_id INT NULL,
        reason VARCHAR(255) NOT NULL,
        details TEXT NULL,
        evidence_image VARCHAR(500) NULL,
        status ENUM('Pending', 'Inspecting', 'Resolved') DEFAULT 'Pending',
        admin_note TEXT NULL,
        handled_by INT NULL,
        handled_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
        FOREIGN KEY (cat_id) REFERENCES cats(cat_id) ON DELETE SET NULL,
        FOREIGN KEY (handled_by) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `reports` created or verified successfully.');

    // 2. Create report_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_images (
        image_id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Table `report_images` created or verified successfully.');

    // 3. Check existing reports count
    const [existing] = await pool.query('SELECT COUNT(*) AS count FROM reports');
    if (existing[0].count === 0) {
      console.log('Seeding initial reports...');

      // Get sample users
      const [users] = await pool.query('SELECT user_id, username FROM users WHERE role = "user" LIMIT 5');
      const [cats] = await pool.query('SELECT cat_id, pet_name, poster_id FROM cats LIMIT 3');

      const uReporter = users[0] ? users[0].user_id : 1;
      const uReported1 = users[1] ? users[1].user_id : (users[0] ? users[0].user_id : 1);
      const uReported2 = users[2] ? users[2].user_id : uReported1;
      const cat1 = cats[0] ? cats[0].cat_id : null;
      const cat2 = cats[1] ? cats[1].cat_id : null;

      const sampleReports = [
        {
          reporter_id: uReporter,
          reported_user_id: uReported1,
          cat_id: cat1,
          reason: 'รูปภาพไม่เหมาะสม',
          details: 'ภาพที่ลงประกาศไม่ตรงกับแมวจริง มีภาพหลอกลวงผู้ใช้งาน',
          evidence_image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
          status: 'Pending',
          created_at: '2026-03-02 10:30:00'
        },
        {
          reporter_id: uReporter,
          reported_user_id: uReported2,
          cat_id: null,
          reason: 'พฤติกรรมน่าสงสัย',
          details: 'มีการส่งข้อความส่วนตัวหลอกขอโอนเงินค่ามัดจำแมว',
          evidence_image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
          status: 'Inspecting',
          created_at: '2026-03-10 14:15:00'
        },
        {
          reporter_id: uReported1,
          reported_user_id: uReported2,
          cat_id: cat2,
          reason: 'ขายของผิดประเภท',
          details: 'โพสต์ประกาศขายอุปกรณ์สัตว์เลี้ยงราคาแพงในหมวดหาบ้านแมวฟรี',
          evidence_image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
          status: 'Pending',
          created_at: '2026-03-12 09:00:00'
        },
        {
          reporter_id: uReporter,
          reported_user_id: uReported1,
          cat_id: null,
          reason: 'ใช้คำหยาบคาย',
          details: 'ใช้ถ้อยคำรุนแรงในช่องทางแชทกับผู้ขอดูตัวแมว',
          evidence_image: null,
          status: 'Resolved',
          admin_note: 'ได้ทำการตักเตือนผู้ใช้แล้ว และตรวจสอบไม่พบการกระทำซ้ำ',
          handled_by: 1,
          handled_at: '2026-03-16 11:00:00',
          created_at: '2026-03-15 16:45:00'
        }
      ];

      for (const rep of sampleReports) {
        const [res] = await pool.query(`
          INSERT INTO reports (reporter_id, reported_user_id, cat_id, reason, details, evidence_image, status, admin_note, handled_by, handled_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rep.reporter_id,
          rep.reported_user_id,
          rep.cat_id,
          rep.reason,
          rep.details,
          rep.evidence_image,
          rep.status,
          rep.admin_note || null,
          rep.handled_by || null,
          rep.handled_at || null,
          rep.created_at
        ]);

        if (rep.evidence_image) {
          await pool.query(`
            INSERT INTO report_images (report_id, image_url) VALUES (?, ?)
          `, [res.insertId, rep.evidence_image]);
        }
      }

      console.log('✓ Seeded', sampleReports.length, 'sample reports.');
    } else {
      console.log(`ℹ Table 'reports' already contains ${existing[0].count} records.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error in createReportsTable:', err);
    process.exit(1);
  }
}

createReportsTable();
