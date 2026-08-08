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

        // 7. สร้างห้องแชทอัตโนมัติ (ให้ผู้ยื่นคำร้องและเจ้าของแมวเริ่มคุยกันได้)
        const [chatResult] = await connection.query(`
            INSERT INTO conversations (match_id)
            VALUES (?)
        `, [matchId]);

        // บันทึกการเปลี่ยนแปลงทั้งหมดลง Database
        await connection.commit();

        // ปล่อย connection คืนให้ระบบ
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'ส่งคำขอรับเลี้ยงแมวและสร้างห้องแชทสำเร็จ',
            data: {
                match_id: matchId,
                room_id: chatResult.insertId,
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

module.exports = {
    createApplication
};