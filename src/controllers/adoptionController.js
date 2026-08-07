const pool = require('../config/database');

// สร้างคำขอรับเลี้ยงแมว (Adopter -> Poster)
async function createAdoptionRequest(req, res) {
    try {
        const { catId, applicantId, matchscore, uploadRemark } = req.body;

        if (!catId || !applicantId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ catId และ applicantId' });
        }

        // Check if already requested
        const [existing] = await pool.query(
            'SELECT * FROM adoptionapplications WHERE cat_id = ? AND applicant_id = ?',
            [catId, applicantId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณได้ส่งคำขอรับเลี้ยงแมวตัวนี้ไปแล้ว' });
        }

        const [result] = await pool.query(
            `INSERT INTO adoptionapplications (cat_id, applicant_id, matchscore, upload_remark, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [catId, applicantId, matchscore || 0, uploadRemark || null]
        );

        return res.status(201).json({
            success: true,
            message: 'ส่งคำขอรับเลี้ยงสำเร็จ',
            match_id: result.insertId
        });

    } catch (error) {
        console.error('createAdoptionRequest error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งคำขอ' });
    }
}

// ดึงคำขอรับเลี้ยงทั้งหมดของ Adopter คนนั้นๆ
async function getRequestsByAdopter(req, res) {
    try {
        const { userId } = req.params;

        const [requests] = await pool.query(`
            SELECT 
                a.match_id,
                a.matchscore,
                a.status,
                a.applied_at,
                c.cat_id,
                c.pet_name,
                (SELECT image_url FROM catphotos WHERE catphotos.cat_id = c.cat_id LIMIT 1) AS image_url
            FROM adoptionapplications a
            JOIN cats c ON a.cat_id = c.cat_id
            WHERE a.applicant_id = ?
            ORDER BY a.applied_at DESC
        `, [userId]);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('getRequestsByAdopter error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ' });
    }
}

// ดึงผู้ขอรับเลี้ยงทั้งหมดสำหรับแมวตัวนั้นๆ (Poster ดู)
async function getRequestsByCat(req, res) {
    try {
        const { catId } = req.params;

        const [requests] = await pool.query(`
            SELECT 
                a.match_id,
                a.matchscore,
                a.status,
                a.applied_at,
                a.upload_remark,
                u.user_id,
                u.fullname,
                u.phonenumber,
                u.line_id,
                u.email,
                p.living_space_type,
                p.experience
            FROM adoptionapplications a
            JOIN users u ON a.applicant_id = u.user_id
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            WHERE a.cat_id = ?
            ORDER BY a.matchscore DESC, a.applied_at DESC
        `, [catId]);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('getRequestsByCat error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขอรับเลี้ยง' });
    }
}

module.exports = {
    createAdoptionRequest,
    getRequestsByAdopter,
    getRequestsByCat
};
