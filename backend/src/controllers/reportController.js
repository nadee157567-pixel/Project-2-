const pool = require('../config/database');

exports.createReport = async (req, res) => {
    try {
        const { reporterId, reportedUserId, catId, reason, details } = req.body;
        
        let evidenceImage = null;
        if (req.file) {
            evidenceImage = req.file.path; // Cloudinary URL
        }

        if (!reporterId || !reason) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลผู้รายงานและเหตุผล' });
        }

        const [result] = await pool.query(`
            INSERT INTO reports (reporter_id, reported_user_id, cat_id, reason, details, evidence_image, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `, [reporterId, reportedUserId || null, catId || null, reason, details || null, evidenceImage]);

        // แจ้งเตือนผู้รายงานว่าได้รับเรื่องแล้ว
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, related_id)
            VALUES (?, 'ส่งรายงานสำเร็จ', 'เราได้รับรายงานของคุณแล้ว ทีมงานจะตรวจสอบและดำเนินการโดยเร็วที่สุด', 'report_submitted', ?)
        `, [reporterId, result.insertId]);

        // แจ้งเตือนผู้ถูกรายงาน (ถ้ามี)
        if (reportedUserId) {
            await pool.query(`
                INSERT INTO notifications (user_id, title, message, type, related_id)
                VALUES (?, 'แจ้งเตือนพฤติกรรม', ?, 'warning', ?)
            `, [reportedUserId, `มีผู้ใช้รายงานบัญชีของคุณในหัวข้อ: "${reason}" กรุณาปฏิบัติตามกฎกติกาอย่างเคร่งครัด`, result.insertId]);
        }

        res.status(201).json({ success: true, message: 'รายงานสำเร็จ ทีมงานจะทำการตรวจสอบต่อไป', reportId: result.insertId });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรายงาน' });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNote } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุสถานะ' });
        }

        // ดึงข้อมูลรายงาน
        const [reports] = await pool.query('SELECT * FROM reports WHERE report_id = ?', [reportId]);
        if (reports.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบรายงานนี้' });
        }
        const report = reports[0];

        // อัปเดตสถานะ
        await pool.query(`
            UPDATE reports SET status = ?, admin_note = ?, handled_at = NOW() WHERE report_id = ?
        `, [status, adminNote || null, reportId]);

        // แจ้งเตือนผู้รายงานว่าตรวจสอบเสร็จสิ้น
        if (status === 'Resolved' || status === 'Inspecting') {
            const statusMsg = status === 'Resolved' ? 'ตรวจสอบและดำเนินการเสร็จสิ้น' : 'กำลังดำเนินการตรวจสอบ';
            await pool.query(`
                INSERT INTO notifications (user_id, title, message, type, related_id)
                VALUES (?, 'อัปเดตสถานะการรายงาน', ?, 'report_updated', ?)
            `, [report.reporter_id, `รายงานของคุณ (หมายเลข ${reportId}) ${statusMsg}`, reportId]);
            
            // แจ้งเตือนผู้ถูกรายงานว่าโดนตรวจสอบแล้ว
            if (report.reported_user_id && status === 'Resolved') {
                const note = adminNote ? `รายละเอียด: ${adminNote}` : 'ทีมงานได้ตรวจสอบและดำเนินการเรียบร้อยแล้ว';
                await pool.query(`
                    INSERT INTO notifications (user_id, title, message, type, related_id)
                    VALUES (?, 'ผลการตรวจสอบบัญชี', ?, 'report_resolved', ?)
                `, [report.reported_user_id, `บัญชีของคุณได้รับการตรวจสอบจากทีมงาน ${note}`, reportId]);
            }
        }

        res.status(200).json({ success: true, message: 'อัปเดตสถานะรายงานสำเร็จ' });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
};
