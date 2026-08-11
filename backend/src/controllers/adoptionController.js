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

const createAdoptionRequest = async (req, res) => {
    try {
        const { applicantId, catId, matchscore, uploadRemark } = req.body;

        if (!applicantId || !catId) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        const [existing] = await pool.query(
            "SELECT * FROM adoptionapplications WHERE applicant_id = ? AND cat_id = ? AND status IN ('pending', 'interview')",
            [applicantId, catId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณได้ส่งคำขอไปแล้ว' });
        }

        const [result] = await pool.query(
            "INSERT INTO adoptionapplications (cat_id, applicant_id, matchscore, upload_remark, status) VALUES (?, ?, ?, ?, 'pending')",
            [catId, applicantId, matchscore || 0, uploadRemark || '']
        );



        await pool.query("INSERT INTO conversations (match_id) VALUES (?)", [result.insertId]);

        return res.status(201).json({ success: true, message: 'ส่งคำขอสำเร็จ' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

const getRequestsByAdopter = async (req, res) => {
    try {
        const userId = req.params.userId;
        const [rows] = await pool.query(`
            SELECT a.*, c.pet_name, c.pet_breed, 
                   (SELECT image_url FROM catphotos WHERE cat_id = c.cat_id LIMIT 1) as cat_image,
                   (SELECT image_url FROM catphotos WHERE cat_id = c.cat_id LIMIT 1) as image_url
            FROM adoptionapplications a
            JOIN cats c ON a.cat_id = c.cat_id
            WHERE a.applicant_id = ?
        `, [userId]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

const getRequestsByCat = async (req, res) => {
    try {
        const catId = req.params.catId;
        const [rows] = await pool.query(`
            SELECT a.*, u.fullname, u.phonenumber, p.living_space_type, p.experience
            FROM adoptionapplications a
            JOIN users u ON a.applicant_id = u.user_id
            LEFT JOIN user_profiles p ON a.applicant_id = p.user_id
            WHERE a.cat_id = ?
        `, [catId]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const { status } = req.body;
        await pool.query("UPDATE adoptionapplications SET status = ? WHERE match_id = ?", [status, matchId]);
        
        if (status === 'rejected') {
            // Delete the conversation room when a request is rejected
            await pool.query("DELETE FROM conversations WHERE match_id = ?", [matchId]);
        } else if (status === 'approved') {
            const [app] = await pool.query("SELECT cat_id FROM adoptionapplications WHERE match_id = ?", [matchId]);
            if (app.length > 0) {
                await pool.query("UPDATE cats SET status = 'adopted' WHERE cat_id = ?", [app[0].cat_id]);
                
                // Get other match_ids for this cat to delete their conversation rooms
                const [otherApps] = await pool.query("SELECT match_id FROM adoptionapplications WHERE cat_id = ? AND match_id != ?", [app[0].cat_id, matchId]);
                
                await pool.query("UPDATE adoptionapplications SET status = 'rejected' WHERE cat_id = ? AND match_id != ?", [app[0].cat_id, matchId]);
                
                if (otherApps.length > 0) {
                    const otherMatchIds = otherApps.map(oa => oa.match_id);
                    await pool.query("DELETE FROM conversations WHERE match_id IN (?)", [otherMatchIds]);
                }
            }
        }
        
        return res.status(200).json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
        console.error('updateRequestStatus error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

const getAssessmentDetails = async (req, res) => {
    try {
        const { applicantId, catId } = req.params;
        
        // Find latest assessment for this applicant and cat
        const [assessments] = await pool.query(
            "SELECT * FROM assessments WHERE applicant_id = ? AND cat_id = ? ORDER BY assessed_at DESC LIMIT 1",
            [applicantId, catId]
        );
        
        if (assessments.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการประเมิน' });
        }
        
        const assessment = assessments[0];
        
        // Find assessment details
        const [details] = await pool.query(
            "SELECT ad.*, ec.profile_field FROM assessment_details ad JOIN evaluation_criteria ec ON ad.criteria_id = ec.criteria_id WHERE ad.assessment_id = ?",
            [assessment.assessment_id]
        );
        
        // Build score_detail object
        const score_detail = {
            space: { stars: 0 },
            budget: { stars: 0 },
            attention: { stars: 0 },
            experience: { stars: 0 }
        };
        
        details.forEach(d => {
            let key = null;
            if (d.profile_field === 'space_level') key = 'space';
            else if (d.profile_field === 'monthly_budget') key = 'budget';
            else if (d.profile_field === 'attention_level') key = 'attention';
            else if (d.profile_field === 'experience_level') key = 'experience';
            
            if (key) {
                score_detail[key] = {
                    stars: d.stars || 0,
                    score: d.score_received,
                    max_score: d.max_score
                };
            }
        });
        
        return res.status(200).json({
            success: true,
            data: {
                match_percentage: assessment.match_percentage || assessment.total_score,
                score_detail: score_detail
            }
        });
    } catch (error) {
        console.error('getAssessmentDetails error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

module.exports = {
    createApplication,
    createAdoptionRequest,
    getRequestsByAdopter,
    getRequestsByCat,
    updateRequestStatus,
    getAssessmentDetails
};