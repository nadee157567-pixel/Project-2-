const pool = require('../config/database');

// ดึงเกณฑ์จากฐานข้อมูล
const getCriteria = async () => {
    const [rows] = await pool.query(`SELECT criteria_id, profile_field, condition_value, scoreweight FROM evaluation_criteria`);
    const criteria = {};
    rows.forEach(row => {
        if (!criteria[row.profile_field]) criteria[row.profile_field] = {};
        criteria[row.profile_field][row.condition_value] = {
            id: row.criteria_id,
            weight: row.scoreweight
        };
    });
    return criteria;
};

const matchSelectedCat = async (req, res) => {
    try {
        const { userId, catId } = req.params;

        // 1. Get Adopter Profile
        const [profileRows] = await pool.query(`
            SELECT p.*, u.fullname 
            FROM user_profiles p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.user_id = ?
        `, [userId]);

        if (profileRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ขอรับเลี้ยง (กรุณากรอกโปรไฟล์ก่อน)' });
        }
        const profile = profileRows[0];

        // 2. Get Cat Requirements
        const [catRows] = await pool.query(`SELECT * FROM cats WHERE cat_id = ?`, [catId]);
        if (catRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแมว' });
        }
        const cat = catRows[0];

        // 3. Get Criteria
        const criteria = await getCriteria();
        let totalScore = 0;
        const details = [];
        let stars = { space: 0, time: 0, budget: 0, experience: 0 };

        // Helper to add detail
        const addDetail = (field, condition, applicantVal, reqVal) => {
            const crit = criteria[field] && criteria[field][condition];
            const score = crit ? crit.weight : 0;
            totalScore += score;
            if (crit) {
                details.push({
                    criteria_id: crit.id,
                    actual_value: String(applicantVal),
                    score_received: score,
                    explanation: `Matched: ${condition}`
                });
            }
            return score;
        };

        // --- Space ---
        let spaceCondition = profile.living_space_type === 'house' ? 'house' : 'condo';
        const spaceScore = addDetail('living_space_type', spaceCondition, profile.living_space_type, cat.req_space_level);
        stars.space = Math.round((spaceScore / 20) * 5);

        // --- Time ---
        let timeCondition = 'less_than_3';
        if (profile.daily_free_hours >= 5) timeCondition = '5_or_more';
        else if (profile.daily_free_hours >= 3) timeCondition = '3_to_4';
        const timeScore = addDetail('daily_free_hours', timeCondition, profile.daily_free_hours, cat.req_attention);
        stars.time = Math.round((timeScore / 20) * 5);

        // --- Experience ---
        let expCondition = 'none';
        if (profile.experience === 'experienced') expCondition = 'expert';
        else if (profile.experience === 'beginner') expCondition = 'beginner';
        const expScore = addDetail('experience_level', expCondition, profile.experience, 'any');
        stars.experience = Math.round((expScore / 20) * 5);

        // --- Budget ---
        let budgetCondition = (profile.max_monthly_budget >= cat.est_monthly_cost) ? 'sufficient' : 'sufficient'; // Simplified
        const budgetScore = addDetail('max_monthly_budget', budgetCondition, profile.max_monthly_budget, cat.est_monthly_cost);
        stars.budget = Math.round((budgetScore / 20) * 5);

        // --- Pets & Children (Bonus) ---
        addDetail('has_other_pets', 'compatible', profile.has_other_pets, 'any');
        addDetail('has_children', 'suitable', profile.has_children, 'any');

        // Determine Suitability
        let suitability = 'consider';
        if (totalScore >= 80) suitability = 'highly_suitable';
        else if (totalScore >= 60) suitability = 'suitable';
        else if (totalScore < 40) suitability = 'not_suitable';

        // Save Assessment
        const [assessResult] = await pool.query(`
            INSERT INTO assessments (applicant_id, cat_id, total_score, suitability_level, recommendation)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, catId, totalScore, suitability, 'ระบบประเมินอัตโนมัติ']);
        
        const assessmentId = assessResult.insertId;

        // Save Details
        for (let d of details) {
            await pool.query(`
                INSERT INTO assessment_details (assessment_id, criteria_id, actual_value, score_received, explanation)
                VALUES (?, ?, ?, ?, ?)
            `, [assessmentId, d.criteria_id, d.actual_value, d.score_received, d.explanation]);
        }

        return res.status(200).json({
            success: true,
            message: 'ประเมินสำเร็จ',
            data: {
                matchPercent: totalScore,
                scores: stars
            }
        });
    } catch (error) {
        console.error('Matching Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const matchAllCats = async (req, res) => {
    return res.status(501).json({ success: false, message: 'Not implemented' });
};

module.exports = {
    matchSelectedCat,
    matchAllCats,
};