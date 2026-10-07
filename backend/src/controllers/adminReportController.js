const pool = require('../config/database');

/**
 * 1. ดึงรายการรายงานทั้งหมด (รองรับ Filter ตามสถานะ: Pending, Inspecting, Resolved หรือ ทั้งหมด)
 * GET /api/admin/reports?status=Pending
 */
async function getReports(req, res) {
  const { status } = req.query;
  try {
    let query = `
      SELECT 
        r.report_id,
        r.report_id AS id,
        r.reporter_id,
        r.reported_user_id,
        r.cat_id,
        r.reason,
        r.reason AS issue,
        r.details,
        (SELECT image_url FROM report_images WHERE report_id = r.report_id ORDER BY image_id ASC LIMIT 1) AS evidence_image,
        r.status,
        r.admin_note,
        r.handled_by,
        r.handled_at,
        r.created_at,
        r.updated_at,
        u_reporter.username AS reported_by,
        u_reporter.fullname AS reporter_name,
        COALESCE(u_reported.user_id, u_poster.user_id) AS target_user_id,
        COALESCE(u_reported.username, u_poster.username, 'ไม่ระบุ') AS username,
        COALESCE(u_reported.fullname, u_poster.fullname, 'ไม่ระบุ') AS reported_user_fullname,
        COALESCE(u_reported.is_banned, u_poster.is_banned, 0) AS reported_user_banned,
        c.pet_name AS reported_cat,
        c.pet_breed AS reported_cat_breed
      FROM reports r
      LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.user_id
      LEFT JOIN users u_reported ON r.reported_user_id = u_reported.user_id
      LEFT JOIN cats c ON r.cat_id = c.cat_id
      LEFT JOIN users u_poster ON c.poster_id = u_poster.user_id
    `;
    const params = [];

    // กรองสถานะถ้ามีการระบุ
    if (status && status !== 'ทั้งหมด' && status !== 'All') {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.query(query, params);

    // Format ข้อมูลให้พร้อมใช้งานทั้ง id, issue, date ตามที่ Admin Web ต้องการ
    const formattedReports = rows.map(row => {
      const d = new Date(row.created_at);
      const dateStr = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

      return {
        ...row,
        id: row.report_id,
        issue: row.reason,
        date: dateStr
      };
    });

    res.json({
      success: true,
      reports: formattedReports,
      data: formattedReports
    });
  } catch (err) {
    console.error('Error in getReports:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}

/**
 * 2. ดูรายละเอียดรายงานแบบละเอียด พร้อมรูปหลักฐานและข้อมูลแมว/ผู้ถูกรายงาน
 * GET /api/admin/reports/:id
 */
async function getReportDetail(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.report_id,
        r.report_id AS id,
        r.reporter_id,
        r.reported_user_id,
        r.cat_id,
        r.reason,
        r.reason AS issue,
        r.details,
        (SELECT image_url FROM report_images WHERE report_id = r.report_id ORDER BY image_id ASC LIMIT 1) AS evidence_image,
        r.status,
        r.admin_note,
        r.handled_by,
        r.handled_at,
        r.created_at,
        r.updated_at,
        u_reporter.username AS reported_by,
        u_reporter.fullname AS reporter_name,
        u_reporter.email AS reporter_email,
        u_reporter.phonenumber AS reporter_phone,
        COALESCE(u_reported.user_id, u_poster.user_id) AS target_user_id,
        COALESCE(u_reported.username, u_poster.username, 'ไม่ระบุ') AS username,
        COALESCE(u_reported.fullname, u_poster.fullname, 'ไม่ระบุ') AS reported_user_fullname,
        COALESCE(u_reported.email, u_poster.email) AS reported_user_email,
        COALESCE(u_reported.is_banned, u_poster.is_banned, 0) AS reported_user_banned,
        COALESCE(u_reported.ban_reason, u_poster.ban_reason) AS reported_user_ban_reason,
        c.pet_name AS reported_cat,
        c.pet_breed AS reported_cat_breed,
        c.gender AS reported_cat_gender,
        c.status AS reported_cat_status,
        u_admin.username AS handled_by_admin
      FROM reports r
      LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.user_id
      LEFT JOIN users u_reported ON r.reported_user_id = u_reported.user_id
      LEFT JOIN cats c ON r.cat_id = c.cat_id
      LEFT JOIN users u_poster ON c.poster_id = u_poster.user_id
      LEFT JOIN users u_admin ON r.handled_by = u_admin.user_id
      WHERE r.report_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายงาน' });
    }

    const report = rows[0];

    // รูปหลักฐานจาก report_images
    const [evidence] = await pool.query(
      `SELECT image_id, image_url FROM report_images WHERE report_id = ?`,
      [id]
    );

    // รูปภาพแมว (ถ้ามี cat_id)
    let catPhotos = [];
    if (report.cat_id) {
      const [photos] = await pool.query(
        `SELECT photo_id, image_url FROM catphotos WHERE cat_id = ?`,
        [report.cat_id]
      );
      catPhotos = photos;
    }

    const d = new Date(report.created_at);
    const dateStr = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    const result = {
      report: {
        ...report,
        id: report.report_id,
        issue: report.reason,
        date: dateStr
      },
      evidence: evidence,
      cat_photos: catPhotos
    };

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getReportDetail:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}

/**
 * 3. แอดมินตัดสินผลการรายงาน (เริ่มตรวจ / ไม่พบความผิด / สั่งแบนผู้กระทำผิด)
 * POST /api/admin/reports/:id/update
 * Body: { action: 'inspect' | 'ignore' | 'ban' | 'verified', reason?: string, note?: string }
 */
async function updateReportStatus(req, res) {
  const { id } = req.params;
  const { action, reason, note } = req.body;
  const adminId = req.user?.user_id || 1;
  const adminNote = note || reason || null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ตรวจสอบรายงานที่มีอยู่
    const [reportRows] = await connection.query(`
      SELECT 
        r.report_id,
        r.reporter_id,
        r.reported_user_id,
        r.cat_id,
        r.reason,
        r.status,
        c.poster_id AS cat_poster_id
      FROM reports r
      LEFT JOIN cats c ON r.cat_id = c.cat_id
      WHERE r.report_id = ?
    `, [id]);

    if (reportRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบรายงานที่ต้องการอัปเดต' });
    }

    const currentReport = reportRows[0];
    const targetUserId = currentReport.reported_user_id || currentReport.cat_poster_id;

    let newStatus = currentReport.status;
    let actionLog = 'UPDATE_REPORT';
    let actionDetail = `Updated report #${id}`;

    if (action === 'inspect' || action === 'Inspecting') {
      newStatus = 'Inspecting';
      actionLog = 'INSPECT_REPORT';
      actionDetail = `Admin #${adminId} started inspecting report #${id}`;
      await connection.query(
        `UPDATE reports SET status = 'Inspecting', handled_by = ? WHERE report_id = ?`,
        [adminId, id]
      );
    } else if (action === 'ignore' || action === 'verified' || action === 'unfounded' || action === 'resolve') {
      newStatus = 'Resolved';
      actionLog = 'RESOLVE_REPORT';
      actionDetail = `Admin #${adminId} dismissed/resolved report #${id}. Note: ${adminNote || 'ไม่พบความผิด'}`;
      await connection.query(
        `UPDATE reports SET status = 'Resolved', admin_note = ?, handled_by = ?, handled_at = NOW() WHERE report_id = ?`,
        [adminNote || 'ตรวจสอบแล้วไม่พบความผิดร้ายแรง', adminId, id]
      );
    } else if (action === 'ban' || action === 'banned') {
      newStatus = 'Resolved';
      actionLog = 'BAN_USER_BY_REPORT';
      const banReason = adminNote || `ระงับการใช้งานเนื่องจากถูกรายงาน: ${currentReport.reason}`;

      // อัปเดตสถานะรายงาน
      await connection.query(
        `UPDATE reports SET status = 'Resolved', admin_note = ?, handled_by = ?, handled_at = NOW() WHERE report_id = ?`,
        [banReason, adminId, id]
      );

      // แบนผู้ใช้ที่ถูกรายงาน (ไม่ใช่คนแจ้ง!)
      if (targetUserId) {
        await connection.query(
          `UPDATE users SET is_banned = 1, ban_reason = ?, updated_at = NOW() WHERE user_id = ?`,
          [banReason, targetUserId]
        );
        actionDetail = `Admin #${adminId} banned user #${targetUserId} from report #${id}. Reason: ${banReason}`;
      } else {
        actionDetail = `Admin #${adminId} processed ban for report #${id}, but no target user was identified.`;
      }
    } else {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid action. Expected inspect, ignore, or ban.' });
    }

    // บันทึก Log ลงตาราง admin_logs
    await connection.query(
      `INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`,
      [adminId, actionLog, actionDetail]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'บันทึกผลการจัดการรายงานเรียบร้อยแล้ว',
      status: newStatus
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in updateReportStatus:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    connection.release();
  }
}

/**
 * 4. ผู้ใช้งานทั่วไปส่งข้อร้องเรียน/รายงาน
 * POST /api/reports หรือ POST /api/admin/reports
 */
async function createReport(req, res) {
  const reporterId = req.user?.user_id;
  const { reported_user_id, cat_id, reason, details, evidence_image } = req.body;

  if (!reporterId) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำการรายงาน' });
  }
  if (!reason) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุหัวข้อที่ต้องการรายงาน' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(`
      INSERT INTO reports (reporter_id, reported_user_id, cat_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'Pending', NOW())
    `, [
      reporterId,
      reported_user_id || null,
      cat_id || null,
      reason,
      details || null
    ]);

    const reportId = result.insertId;

    if (evidence_image) {
      await connection.query(
        `INSERT INTO report_images (report_id, image_url) VALUES (?, ?)`,
        [reportId, evidence_image]
      );
    }

    await connection.commit();

    // ดึงชื่อผู้รายงานและผู้ถูกรายงานเพื่อส่ง Notification แบบเรียลไทม์
    let reporterName = 'ผู้ใช้งาน';
    let targetName = 'ไม่ระบุ';
    let reportedCat = null;
    try {
      const [rUser] = await pool.query('SELECT username, first_name, last_name FROM users WHERE user_id = ?', [reporterId]);
      if (rUser.length > 0) {
        reporterName = rUser[0].username || `${rUser[0].first_name || ''} ${rUser[0].last_name || ''}`.trim() || 'ผู้ใช้งาน';
      }
      if (reported_user_id) {
        const [tUser] = await pool.query('SELECT username, first_name, last_name FROM users WHERE user_id = ?', [reported_user_id]);
        if (tUser.length > 0) {
          targetName = tUser[0].username || `${tUser[0].first_name || ''} ${tUser[0].last_name || ''}`.trim() || 'ผู้ใช้งาน';
        }
      }
      if (cat_id) {
        const [cRows] = await pool.query('SELECT pet_name FROM cats WHERE cat_id = ?', [cat_id]);
        if (cRows.length > 0) {
          reportedCat = cRows[0].pet_name;
        }
      }
    } catch (_) {}

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newReportPayload = {
      id: reportId,
      report_id: reportId,
      reporter_id: reporterId,
      reported_user_id: reported_user_id || null,
      cat_id: cat_id || null,
      username: targetName,
      reported_by: reporterName,
      reported_cat: reportedCat,
      issue: reason,
      reason: reason,
      details: details || '',
      evidence_image: evidence_image || null,
      status: 'Pending',
      date: dateStr,
      created_at: now.toISOString()
    };

    // ส่ง real-time socket event ไปยัง Admin Web
    try {
      const socketExport = require('../socket');
      const io = socketExport.getIO();
      if (io) {
        io.emit('new_report', newReportPayload);
        console.log('📡 [Socket] Emitted new_report event:', reportId);
      }
    } catch (socketErr) {
      console.error('Socket notification emit error:', socketErr);
    }

    res.status(201).json({
      success: true,
      message: 'ส่งรายงานเรียบร้อยแล้ว แอดมินจะดำเนินการตรวจสอบ',
      report_id: reportId,
      report: newReportPayload
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in createReport:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  getReports,
  getReportDetail,
  updateReportStatus,
  createReport
};