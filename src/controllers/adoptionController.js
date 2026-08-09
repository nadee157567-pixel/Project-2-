const pool = require('../config/database');


//POST /api/applications (ส่งคำร้องขอรับเลี้ยง)
const createApplication = async (req, res) => {
    // ดึง connection ออกมาใช้งานสำหรับทำ Transaction
    const connection = await pool.getConnection();

    try {
        const {
            applicant_id,
            cat_id,
            assessment_id,
            message
        } = req.body;

        // 1. ตรวจข้อมูลที่จำเป็น
        if (!applicant_id) { 
            return res.status(400).json({ success: false, message: 'กรุณาระบุไอดีผู้สมัคร' });
        }
        if (!cat_id) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุไอดีแมว' });
        }
        if (!assessment_id) {
            return res.status(400).json({ success: false, message: 'กรุณาประเมินความเหมาะสมก่อนส่งคำขอ' });
        }

        // เริ่มต้น Transaction
        await connection.beginTransaction();

        // 2. ตรวจสอบข้อมูลแมวและเจ้าของแมว (poster_id)
        const [cats] = await connection.query(`
            SELECT cat_id, pet_name, status, poster_id
            FROM cats
            WHERE cat_id = ?
            LIMIT 1`,
            [cat_id]
        );

        if (cats.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแมว' });
        }

        const cat = cats[0];

        if (cat.status === 'adopted') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'แมวตัวนี้ถูกรับเลี้ยงไปแล้ว' });
        }

        // ป้องกันเจ้าของแมวส่งคำร้องขอรับเลี้ยงแมวตัวเอง
        if (Number(applicant_id) === Number(cat.poster_id)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'เจ้าของแมวไม่สามารถส่งคำขอรับเลี้ยงแมวของตนเองได้' });
        }
        
        // 3. ตรวจสอบใบประเมินความเหมาะสม
        const [assessments] = await connection.query(`
            SELECT assessment_id, applicant_id, cat_id, total_score, suitability_level
            FROM assessments
            WHERE assessment_id = ? AND applicant_id = ? AND cat_id = ?
            LIMIT 1
            `,
            [assessment_id, applicant_id, cat_id]
        );

        if (assessments.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลการประเมินที่ตรงกับผู้ใช้และแมวตัวนี้' });
        }

        const assessment = assessments[0];

        // ถ้า Rule-based Filtering ไม่ผ่าน (not_suitable) ไม่ให้ส่งคำร้อง
        if (assessment.suitability_level === 'not_suitable') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'คุณสมบัติไม่ผ่านเกณฑ์ขั้นต่ำ (not_suitable)' });
        }

        // 4. ป้องกันการส่งคำขอซ้ำซ้อนสำหรับแมวตัวเดิม
        const [existingApplications] = await connection.query(`
            SELECT match_id, status
            FROM adoptionapplications
            WHERE applicant_id = ? AND cat_id = ? AND status IN ('pending','interview')
            LIMIT 1
            `,
            [applicant_id, cat_id]
        );

        if (existingApplications.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'คุณได้ส่งคำขอรับเลี้ยงแมวตัวนี้ไปแล้ว' });
        }

        // 5. บันทึกคำขอรับเลี้ยงลงระบบ
        const [result] = await connection.query(`
            INSERT INTO adoptionapplications (
                applicant_id, cat_id, matchscore, upload_remark, status
            ) VALUES (?, ?, ?, ?, ?)
            `,
            [applicant_id, cat_id, assessment.total_score, message || null, 'pending']
        );
        const matchId = result.insertId;

        // 6. อัพเดทสถานะแมวเป็น pending
        await connection.query(`
            UPDATE cats
            SET status = 'pending'
            WHERE cat_id = ?
        `, [cat_id]);

        // บันทึกการเปลี่ยนแปลงทั้งหมดลง Database
        await connection.commit();

        // ปล่อย connection คืนให้ระบบ
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'ส่งคำขอรับเลี้ยงแมวสำเร็จ',
            data: {
                match_id: matchId,
                applicant_id: Number(applicant_id),
                cat_id: Number(cat_id),
                status: 'pending',
            }
        });
            
    } catch (error) {
        // หากมีข้อผิดพลาดให้ทำการ Rollback ข้อมูลกลับทั้งหมดเพื่อป้องกันข้อมูลพัง
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
    }
};

// สร้างคำขอรับเลี้ยงแมว (Adopter -> Poster) [จาก main branch]
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

// อัปเดตสถานะคำขอรับเลี้ยง (อนุมัติ/ไม่อนุมัติ)
async function updateRequestStatus(req, res) {
    const connection = await pool.getConnection();
    try {
        const { matchId } = req.params;
        const { status } = req.body; // 'approved' หรือ 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
        }

        await connection.beginTransaction();

        // อัปเดตสถานะของคำขอนี้
        await connection.query(
            'UPDATE adoptionapplications SET status = ? WHERE match_id = ?',
            [status, matchId]
        );

        if (status === 'approved') {
            // ดึง cat_id ของคำขอนี้
            const [rows] = await connection.query(
                'SELECT cat_id FROM adoptionapplications WHERE match_id = ?',
                [matchId]
            );
            
            if (rows.length > 0) {
                const catId = rows[0].cat_id;

                // อัปเดตคำขออื่นๆ ของแมวตัวนี้ให้เป็น rejected
                await connection.query(
                    'UPDATE adoptionapplications SET status = ? WHERE cat_id = ? AND match_id != ? AND status = ?',
                    ['rejected', catId, matchId, 'pending']
                );

                // อัปเดตสถานะแมวให้เป็นได้บ้านแล้ว ('adopted' หรือสถานะที่คุณตั้งไว้)
                await connection.query(
                    'UPDATE cats SET status = ? WHERE cat_id = ?',
                    ['adopted', catId]
                );
            }
        }

        await connection.commit();
        
        return res.status(200).json({
            success: true,
            message: 'อัปเดตสถานะสำเร็จ'
        });

    } catch (error) {
        await connection.rollback();
        console.error('updateRequestStatus error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    } finally {
        connection.release();
    }
}

module.exports = {
    createApplication,
    createAdoptionRequest,
    getRequestsByAdopter,
    getRequestsByCat,
    updateRequestStatus
};
