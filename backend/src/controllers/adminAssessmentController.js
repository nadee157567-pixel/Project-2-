const pool = require('../config/database');

//ดึงรายการแบบประเมินทั้งหมด
async function getAssessments(req, res) {
    try {
        const [assessments] = await pool.query(`
            SELECT 
                a.*,
                u.fullname AS applicant_name,
                u.username AS applicant_username,
                u.phonenumber AS applicant_phone,
                u.email AS applicant_email,
                c.pet_name AS cat_name,
                c.pet_breed,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS cat_image
            FROM assessments a
            LEFT JOIN users u ON a.applicant_id = u.user_id
            LEFT JOIN cats c ON a.cat_id = c.cat_id
            ORDER BY a.assessed_at DESC
        `);
        return res.status(200).json({ success: true, data: assessments });
    } catch (error) {
        console.error('getAssessments error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลการประเมินได้' });
    }
}

//ดึงรายการแบบประเมินรายบุคคล
async function getAssessmentById(req, res) {
    try {
        const assessmentId = req.params.id;
        //ดึงข้อมูลหลัก
        const [assessment] = await pool.query(`
            SELECT 
                a.*,
                u.fullname AS applicant_name,
                u.username AS applicant_username,
                u.phonenumber AS applicant_phone,
                u.email AS applicant_email,
                c.pet_name AS cat_name,
                c.pet_breed,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS cat_image
            FROM assessments a
            LEFT JOIN users u ON a.applicant_id = u.user_id
            LEFT JOIN cats c ON a.cat_id = c.cat_id
            WHERE a.assessment_id = ?
        `, [assessmentId]);

        if (assessment.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบประเมิน' });
        }

        //ดึงรายละเอียดคำตอบในแต่ละเเกณฑ์
        const [details] = await pool.query(`
            SELECT ad.*, ec.criteria_name, ec.criteria_code
            FROM assessment_details ad
            LEFT JOIN evaluation_criteria ec ON ad.criteria_id = ec.criteria_id
            WHERE ad.assessment_id = ?
        `, [assessmentId]);

        //รวมข้อมูล
        const result = { ...assessment[0], details };
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('getAssessmentById error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลการประเมินได้' });
    }
}

//อัปเดตสถานะแบบประเมิน
async function updateAssessmentStatus(req, res) {
    try {
        const assessmentId = req.params.id;
        const { status } = req.body;
        const [result] = await pool.query(`UPDATE assessments SET status = ? WHERE assessment_id = ?`, [status, assessmentId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบประเมิน' });
        }
        return res.status(200).json({ success: true, message: 'อัปเดตสถานะแบบประเมินสำเร็จ' });
    } catch (error) {
        console.error('updateAssessmentStatus error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะแบบประเมินได้' });
    }
}

//ดึงข้อข้อมูลสรุปสัดส่วนของผลการประเมินเพื่อสร้างกราฟ วงกลม
async function getAssessmentStatsSummary(req, res) {
    try {
        //ใช้ SUM และ CASE WHEN เพื่อสรุปข้อมูลเป็นจำนวน (Count) ของแต่ละสถานะ
        const [stats] = await pool.query(`SELECT
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM assessments`);

        //ค่าที่ได้จาก SUM อาจเป็น null ถ้าไม่มีข้อมูล ให้แทนด้วย 0
        const result = {
            approved: Number(stats[0].approved) || 0,
            rejected: Number(stats[0].rejected) || 0,
            pending: Number(stats[0].pending) || 0
        };

        //คำนวนเปอร์เซ็นต์
        const total = result.approved + result.rejected + result.pending;
        const percentages = {
            approved: total > 0 ? (result.approved / total * 100).toFixed(1) : 0,
            rejected: total > 0 ? (result.rejected / total * 100).toFixed(1) : 0,
            pending: total > 0 ? (result.pending / total * 100).toFixed(1) : 0
        };

        return res.status(200).json({ success: true, data: { ...result, percentages } });
    } catch (error) {
        console.error('getAssessmentStatsSummary error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลสถิติได้' });
    }
}

module.exports = {
    getAssessments,
    getAssessmentById,
    updateAssessmentStatus,
    getAssessmentStatsSummary
}