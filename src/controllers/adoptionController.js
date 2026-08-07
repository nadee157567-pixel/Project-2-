const pool = require('../config/database');

//POST /api/applications (ส่งคำร้องขอรับเลี้ยง)
const createApplication = async (req, res) => {
    try {
        const {
            applicant_id,
            cat_id,
            assessment_id, // แก้พิมพ์ผิดจาก assesment_id
            message
        } = req.body;

        // ตรวจข้อมูลที่จำเป็น
        if (!applicant_id) { 
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุไอดีผู้สมัคร'
            });
        }

        if (!cat_id) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุไอดีแมว'
            });
        }

        if (!assessment_id) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาประเมินความเหมาะสมก่อนส่งคำขอ',
            });
        }

        // ตรวจสอบว่ามีคำขอที่ยังไม่ได้รับการตอบกลับสำหรับแมวตัวนี้หรือไม่
        const [cats] = await pool.query(`
            SELECT cat_id, pet_name, status
            FROM cats
            WHERE cat_id = ?
            LIMIT 1`,
            [cat_id]
        );

        // ถ้าไม่มีแมว หรือแมวถูกรับเลี้ยงไปแล้ว
        if (cats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลแมว หรือแมวถูกรับเลี้ยงไปแล้ว',
            });
        }

        const cat = cats[0];

        if (cat.status === 'adopted') {
            return res.status(400).json({
                success: false,
                message: 'แมวตัวนี้ถูกรับเลี้ยงไปแล้ว',
            });
        }
        
        // ตรวจ assessment (เปลี่ยนชื่อตารางเป็น assessments และฟิลด์ให้ตรง DB)
        const [assessments] = await pool.query(
            `
            SELECT
                assessment_id,
                applicant_id,
                cat_id,
                total_score,
                suitability_level
            FROM assessments
            WHERE assessment_id = ?
            AND applicant_id = ?
            AND cat_id = ?
            LIMIT 1
            `,
            [assessment_id, applicant_id, cat_id]
        );

        if (assessments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบข้อมูลการประเมินที่ตรงกับผู้ใช้และแมวตัวนี้'
            });
        }

        const assessment = assessments[0];

        // ถ้า Rule-based Filtering (ไม่ผ่าน ไม่ให้ส่งคำร้อง)
        // ใช้ suitability_level แทน eligible
        if (assessment.suitability_level === 'not_suitable') {
            return res.status(400).json({
                success: false,
                message: 'คุณสมบัติไม่ผ่านเกณฑ์ขั้นต่ำ (not_suitable)',
            });
        }

        //ป้องกันการส่งคำขอซ้ำ
        const [existingApplications] = await pool.query(
            `
            SELECT 
                match_id,
                status
            FROM adoptionapplications
            WHERE applicant_id = ?
            AND cat_id = ?
            AND status IN ('pending','interview')
            LIMIT 1
            `,
            [applicant_id, cat_id]
        );

        if (existingApplications.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'คุณได้ส่งคำขอรับเลี้ยงแมวตัวนี้ไปแล้ว'
            });
        }

        //บันทึกคำขอ
        // เปลี่ยนชื่อตารางเป็น adoptionapplications และฟิลด์ให้ตรง
        const [result] = await pool.query(
            `
            INSERT INTO adoptionapplications (
                applicant_id,
                cat_id,
                matchscore,
                upload_remark,
                status
            )
            VALUES (?,?,?,?,?)
            `,
            [
                applicant_id,
                cat_id,
                assessment.total_score,
                message || null,
                'pending'
            ]
        );

        // อัพเดทสถานะแมวเป็น pending (รวม response เข้าด้วยกัน)
        await pool.query(`
            UPDATE cats
            SET status = 'pending'
            WHERE cat_id = ?
        `, [cat_id]);

        return res.status(201).json({
            success: true,
            message: 'ส่งคำขอรับเลี้ยงแมวสำเร็จ',
            data: {
                match_id: result.insertId,
                applicant_id: Number(applicant_id),
                cat_id: Number(cat_id),
                total_score: assessment.total_score,
                status: 'pending',
            }
        });
            
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดภายในระบบ'
        });
    }
};

module.exports = {
    createApplication
};