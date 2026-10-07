const pool = require('../config/database');

// 1. ดึงรายการคำขอรับเลี้ยงทั้งหมดในระบบ
async function getAllApplications(req, res) {
    try {
        const { status, search } = req.query;

        let query = `
            SELECT 
                aa.match_id,
                aa.cat_id,
                aa.applicant_id,
                aa.matchscore,
                aa.status,
                aa.applied_at,
                aa.upload_remark,
                c.pet_name,
                c.pet_breed,
                c.gender AS cat_gender,
                c.age_months AS cat_age,
                c.status AS cat_status,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS cat_image,
                applicant.fullname AS applicant_name,
                applicant.username AS applicant_username,
                applicant.phonenumber AS applicant_phone,
                applicant.email AS applicant_email,
                poster.user_id AS poster_id,
                poster.fullname AS poster_name,
                poster.username AS poster_username,
                poster.phonenumber AS poster_phone
            FROM adoptionapplications AS aa
            JOIN cats AS c ON aa.cat_id = c.cat_id
            JOIN users AS applicant ON aa.applicant_id = applicant.user_id
            JOIN users AS poster ON c.poster_id = poster.user_id
            WHERE 1=1
        `;

        const params = [];

        // กรองตามสถานะคำขอ
        if (status && status !== 'all' && status !== 'ทั้งหมด') {
            query += ` AND aa.status = ?`;
            params.push(status);
        }

        // ค้นหาจากชื่อแมว, ชื่อผู้ขอเลี้ยง หรือชื่อเจ้าของ
        if (search && search.trim() !== '') {
            query += ` AND (c.pet_name LIKE ? OR applicant.fullname LIKE ? OR applicant.username LIKE ? OR poster.fullname LIKE ?)`;
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY aa.applied_at DESC`;

        const [applications] = await pool.query(query, params);

        return res.status(200).json({ 
            success: true, 
            count: applications.length, 
            data: applications 
        });
    } catch (error) {
        console.error('getAllApplications error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลคำขอรับเลี้ยงได้' });
    }
}

// 2. ดูรายละเอียดคำขอรับเลี้ยง 1 รายการ (พร้อมข้อมูลโปรไฟล์ผู้ขอ และประวัติการแชท)
async function getApplicationById(req, res) {
    try {
        const matchId = req.params.id;

        // ดึงข้อมูลหลักของคำขอ
        const [rows] = await pool.query(`
            SELECT 
                aa.match_id,
                aa.cat_id,
                aa.applicant_id,
                aa.matchscore,
                aa.status,
                aa.applied_at,
                aa.upload_remark,
                c.pet_name,
                c.pet_breed,
                c.gender AS cat_gender,
                c.age_months AS cat_age,
                c.status AS cat_status,
                c.personality,
                c.health_note,
                c.est_monthly_cost,
                c.req_space_level,
                c.req_attention,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS cat_image,
                applicant.fullname AS applicant_name,
                applicant.username AS applicant_username,
                applicant.phonenumber AS applicant_phone,
                applicant.email AS applicant_email,
                poster.user_id AS poster_id,
                poster.fullname AS poster_name,
                poster.username AS poster_username,
                poster.phonenumber AS poster_phone,
                poster.email AS poster_email
            FROM adoptionapplications AS aa
            JOIN cats AS c ON aa.cat_id = c.cat_id
            JOIN users AS applicant ON aa.applicant_id = applicant.user_id
            JOIN users AS poster ON c.poster_id = poster.user_id
            WHERE aa.match_id = ?
            LIMIT 1
        `, [matchId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอรับเลี้ยง' });
        }

        const application = rows[0];

        // ดึงข้อมูลสภาพแวดล้อมบ้านจาก user_profiles
        const [profileRows] = await pool.query(`
            SELECT living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience
            FROM user_profiles
            WHERE user_id = ?
            LIMIT 1
        `, [application.applicant_id]);

        application.applicant_profile = profileRows.length > 0 ? profileRows[0] : null;

        // ดึงข้อมูลแบบประเมินความพร้อมและรายละเอียดเกณฑ์ 4 ด้าน (ถ้ามี)
        const [assessments] = await pool.query(`
            SELECT assessment_id, total_score, match_percentage, suitability_level, recommendation, assessed_at
            FROM assessments
            WHERE applicant_id = ? AND cat_id = ?
            ORDER BY assessed_at DESC
            LIMIT 1
        `, [application.applicant_id, application.cat_id]);

        if (assessments.length > 0) {
            const assessmentObj = assessments[0];
            const [details] = await pool.query(`
                SELECT ad.*, ec.criteria_name, ec.criteria_code
                FROM assessment_details ad
                LEFT JOIN evaluation_criteria ec ON ad.criteria_id = ec.criteria_id
                WHERE ad.assessment_id = ?
            `, [assessmentObj.assessment_id]);
            assessmentObj.details = details;
            application.assessment = assessmentObj;
        } else {
            application.assessment = null;
        }

        // ดึงประวัติการสนทนาระหว่างผู้ขอเลี้ยงกับเจ้าของแมว
        const [rooms] = await pool.query(`
            SELECT room_id FROM conversations WHERE match_id = ? LIMIT 1
        `, [matchId]);

        if (rooms.length > 0) {
            const [messages] = await pool.query(`
                SELECT m.message_id, m.sender_id, u.fullname AS sender_name, u.username AS sender_username, m.message_text, m.sent_at
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                WHERE m.room_id = ?
                ORDER BY m.sent_at ASC
            `, [rooms[0].room_id]);
            application.chat_history = messages;
        } else {
            application.chat_history = [];
        }

        return res.status(200).json({ success: true, data: application });
    } catch (error) {
        console.error('getApplicationById error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลคำขอรับเลี้ยงได้' });
    }
}

// 3. แอดมินปรับสถานะคำขอ (Admin Override) กรณีมีข้อพิพาท/การแทรกแซง
async function overrideApplicationStatus(req, res) {
    try {
        const matchId = req.params.id;
        const { status, reason } = req.body;

        const validStatuses = ['pending', 'interview', 'approved', 'rejected'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `สถานะไม่ถูกต้อง (ต้องเป็น: ${validStatuses.join(', ')})` 
            });
        }

        // ตรวจสอบว่าคำขอนี้มีอยู่จริงหรือไม่
        const [existing] = await pool.query(
            `SELECT match_id, cat_id, status FROM adoptionapplications WHERE match_id = ?`,
            [matchId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอรับเลี้ยง' });
        }

        const catId = existing[0].cat_id;
        const prevStatus = existing[0].status;

        // อัปเดตสถานะใน adoptionapplications
        await pool.query(
            `UPDATE adoptionapplications SET status = ? WHERE match_id = ?`,
            [status, matchId]
        );

        // จัดการสถานะของน้องแมว
        if (status === 'approved') {
            await pool.query(`UPDATE cats SET status = 'adopted' WHERE cat_id = ?`, [catId]);
        } else if (prevStatus === 'approved' && status !== 'approved') {
            // ถ้าเคย approved แล้วแอดมินยกเลิก ตรวจสอบว่ามี match อื่นที่ approved ไหม ถ้าไม่มีให้กลับเป็น available
            const [otherApproved] = await pool.query(
                `SELECT match_id FROM adoptionapplications WHERE cat_id = ? AND status = 'approved' AND match_id != ?`,
                [catId, matchId]
            );
            if (otherApproved.length === 0) {
                await pool.query(`UPDATE cats SET status = 'available' WHERE cat_id = ?`, [catId]);
            }
        }

        // บันทึก Log ของแอดมิน
        try {
            const adminId = req.user ? req.user.user_id : 1;
            const logDetails = `เปลี่ยนสถานะคำขอ ID ${matchId} (แมว ID ${catId}) จาก '${prevStatus}' เป็น '${status}'${reason ? ` เหตุผล: ${reason}` : ''}`;
            await pool.query(
                'INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)',
                [adminId, 'OVERRIDE_APPLICATION_STATUS', logDetails]
            );
        } catch (logErr) {
            console.error('Failed to write admin log:', logErr.message);
        }

        return res.status(200).json({ 
            success: true, 
            message: `ปรับสถานะคำขอรับเลี้ยงเป็น '${status}' เรียบร้อยแล้ว` 
        });
    } catch (error) {
        console.error('overrideApplicationStatus error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะคำขอรับเลี้ยงได้' });
    }
}

module.exports = {
    getAllApplications,
    getApplicationById,
    overrideApplicationStatus
};