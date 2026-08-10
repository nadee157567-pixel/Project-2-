const pool = require('../config/database');

const levelToNumber = (level) => {
    if(level === undefined || level === null || level === ''){
        return 0;
    }

    const normalizedLevel = String(level).trim().toLowerCase();

    const levelMap = {
        low: 1, small: 1, beginner: 1, เล็ก: 1, น้อย: 1,
        medium: 2, intermediate: 2, ปานกลาง: 2, กลาง: 2,
        high: 3, large: 3, experienced: 3, ใหญ่: 3, มาก: 3,
    };

    return levelMap[normalizedLevel] ?? 0;
};

const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
    return null;
};

const mysqlBoolean = (value) => Number(value) === 1;

// ดึงเกณฑ์จากฐานข้อมูล (แบบ api)
const getActiveCriteria = async () => {
    const [rows] = await pool.query(`
        SELECT criteria_id, criteria_code, criteria_name, profile_field, condition_value, criteria_type, comparison_type, score_ratio, max_score, is_blocking
        FROM evaluation_criteria
        WHERE is_active = 1
        ORDER BY criteria_code, criteria_id
    `);
    return rows;
};

// getCriteria was removed because it is legacy

const groupCriteriaByCode = (criteriaRows) => {
    return criteriaRows.reduce((grouped, item) => {
        const code = item.criteria_code.toUpperCase();
        if(!grouped[code]) { grouped[code] = []; }
        grouped[code].push(item);
        return grouped;
    }, {});
};

const findCriterion = (criteriaList, conditionValue) => {
    return criteriaList.find((item) => item.condition_value === conditionValue);
};

const calculateLevelScore = (userLevel, requireLevel, criteriaList) => {
    const userValue = levelToNumber(userLevel);
    const requireValue = levelToNumber(requireLevel);

    if(userValue === 0 || requireValue === 0){
        return { score: 0, maxScore: 0, scoreRatio: 0, difference: null, valid: false, criterion: null };
    }

    const difference = userValue - requireValue;
    let conditionValue;

    if(difference >= 0){
        conditionValue = 'equal_or_higher';
    }else if (difference === -1) {
        conditionValue = 'lower_one_level';
    }else {
        conditionValue = 'lower_two_levels';
    }

    const criterion = findCriterion(criteriaList, conditionValue);

    if(!criterion) {
        return { score: 0, maxScore: 0, scoreRatio: 0, difference, valid: false, criterion: null };
    }

    const maxScore = Number(criterion.max_score);
    const scoreRatio = Number(criterion.score_ratio);

    return {
        score: maxScore * scoreRatio,
        maxScore,
        scoreRatio,
        difference,
        valid: true,
        criterion,
    };
};

// calculateBudgetScore removed as budget now uses calculateLevelScore

const scoreToStars = (score, maxScore ) => {
    if (!maxScore || maxScore <= 0) return 0;
    const stars = Math.round((Number(score) / Number(maxScore)) * 5);
    return Math.max(0, Math.min(5, stars));
};

const getMatchLevel = (score) => {
    if (score >= 80) return 'เหมาะสมมาก';
    if (score >= 60) return 'เหมาะสม';
    if (score >= 40) return 'เหมาะสมปานกลาง';
    return 'ยังไม่เหมาะสม';
};

const evaluateCat = (profile, cat, criteriaByCode) => {
    const reasons = [];
    const warnings = [];
    const disqualifications = [];

    if (profile.pets_allowed === false) disqualifications.push('ที่พักอาศัยไม่อนุญาตให้เลี้ยงแมว');
    if (profile.has_severe_allergy === true) disqualifications.push('มีสมาชิกในบ้านแพ้ขนแมวรุนแรง');
    if (profile.has_children === true && !mysqlBoolean(cat.good_with_children)) disqualifications.push('แมวตัวนี้ไม่เหมาะกับบ้านที่มีเด็กเล็ก');
    if (profile.has_cats === true && !mysqlBoolean(cat.good_with_cats)) disqualifications.push('แมวตัวนี้ไม่เหมาะกับบ้านที่มีแมวตัวอื่น');
    if (profile.has_dogs === true && !mysqlBoolean(cat.good_with_dogs)) disqualifications.push('แมวตัวนี้ไม่เหมาะกับบ้านที่มีสุนัข');
    if (mysqlBoolean(cat.has_special_needs) && profile.accepts_special_needs === false) disqualifications.push('ผู้ขอรับเลี้ยงยังไม่พร้อมดูแลแมวที่ต้องการการดูแลพิเศษ');

    const spaceResult = calculateLevelScore(profile.space_level, cat.req_space_level, criteriaByCode.SPACE ?? []);
    if (!spaceResult.valid) warnings.push('ข้อมูลพื้นที่ของแมวหรือผู้รับเลี้ยงไม่สมบูรณ์');
    else if (spaceResult.difference >= 0) reasons.push('พื้นที่ของผู้รับเลี้ยงเพียงพอต่อความต้องการของแมว');
    else if (spaceResult.difference === -1) warnings.push('พื้นที่ต่ำกว่าที่แมวต้องการเล็กน้อย');
    else { warnings.push('พื้นที่ต่ำกว่าที่แมวต้องการมาก'); disqualifications.push('พื้นที่ไม่เพียงพอต่อความต้องการของแมว'); }

    const budgetResult = calculateLevelScore(profile.budget_level, cat.req_budget_level, criteriaByCode.BUDGET ?? []);
    if (!budgetResult.valid) warnings.push('ข้อมูลงบประมาณไม่สมบูรณ์');
    else if (budgetResult.difference >= 0) reasons.push('งบประมาณเพียงพอต่อค่าใช้จ่ายของแมว');
    else if (budgetResult.difference === -1) warnings.push('งบประมาณต่ำกว่าค่าใช้จ่ายของแมวเล็กน้อย');
    else { warnings.push('งบประมาณต่ำกว่าค่าใช้จ่ายที่แมวต้องการมาก'); if(budgetResult.criterion?.is_blocking) disqualifications.push('งบประมาณไม่เพียงพอต่อการดูแลแมว'); }

    const attentionResult = calculateLevelScore(profile.attention_level, cat.req_attention, criteriaByCode.ATTENTION ?? []);
    if (!attentionResult.valid) warnings.push('ข้อมูลเวลาดูแลของแมวหรือผู้รับเลี้ยงไม่สมบูรณ์');
    else if (attentionResult.difference >= 0) reasons.push('ผู้รับเลี้ยงมีเวลาดูแลเพียงพอ');
    else if (attentionResult.difference === -1) warnings.push('เวลาดูแลต่ำกว่าที่แมวต้องการเล็กน้อย');
    else { warnings.push('เวลาดูแลต่ำกว่าที่แมวต้องการมาก'); disqualifications.push('ไม่มีเวลาดูแลเพียงพอ'); }

    const experienceResult = calculateLevelScore(profile.experience_level, cat.req_experience_level, criteriaByCode.EXPERIENCE ?? []);
    if (!experienceResult.valid) warnings.push('ข้อมูลประสบการณ์ของแมวหรือผู้รับเลี้ยงไม่สมบูรณ์');
    else if (experienceResult.difference >= 0) reasons.push('ผู้รับเลี้ยงมีประสบการณ์เหมาะสม');
    else if (experienceResult.difference === -1) warnings.push('ประสบการณ์ต่ำกว่าที่แนะนำเล็กน้อย');
    else { warnings.push('ประสบการณ์ต่ำกว่าที่แมวต้องการมาก'); if(experienceResult.criterion?.is_blocking) disqualifications.push('ประสบการณ์ไม่เพียงพอต่อการดูแลแมว'); }

    const totalScore = spaceResult.score + budgetResult.score + attentionResult.score + experienceResult.score;
    const totalMaxScore = spaceResult.maxScore + budgetResult.maxScore + attentionResult.maxScore + experienceResult.maxScore;
    const matchPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const roundedPercentage = Number(matchPercentage.toFixed(2));

    return {
        cat_id: cat.cat_id,
        pet_name: cat.pet_name,
        pet_breed: cat.pet_breed,
        gender: cat.gender,
        age_months: cat.age_months,
        personality: cat.personality,
        health_note: cat.health_note,
        status: cat.status,
        image_url: cat.image_url,
        compatibility: {
            good_with_children: mysqlBoolean(cat.good_with_children),
            good_with_cats: mysqlBoolean(cat.good_with_cats),
            good_with_dogs: mysqlBoolean(cat.good_with_dogs),
            has_special_needs: mysqlBoolean(cat.has_special_needs),
        },
        requirements: {
            space_level: cat.req_space_level,
            attention_level: cat.req_attention,
            experience_level: cat.req_experience_level,
            budget_level: cat.req_budget_level,
        },
        score_detail: {
            space:{ criteria_id: spaceResult.criterion?.criteria_id, score: spaceResult.score, max_score: spaceResult.maxScore, score_ratio: spaceResult.scoreRatio, stars: scoreToStars(spaceResult.score, spaceResult.maxScore) },
            budget:{ criteria_id: budgetResult.criterion?.criteria_id, score: budgetResult.score, max_score: budgetResult.maxScore, score_ratio: budgetResult.scoreRatio, stars: scoreToStars(budgetResult.score, budgetResult.maxScore) },
            attention:{ criteria_id: attentionResult.criterion?.criteria_id, score: attentionResult.score, max_score: attentionResult.maxScore, score_ratio: attentionResult.scoreRatio, stars: scoreToStars(attentionResult.score, attentionResult.maxScore) },
            experience: { criteria_id: experienceResult.criterion?.criteria_id, score: experienceResult.score, max_score: experienceResult.maxScore, score_ratio: experienceResult.scoreRatio, stars: scoreToStars(experienceResult.score, experienceResult.maxScore) },
        },
        match_score: Number(totalScore.toFixed(2)),
        total_max_score: Number(totalMaxScore.toFixed(2)),
        match_percentage: roundedPercentage,
        match_level: getMatchLevel(roundedPercentage),
        eligible: disqualifications.length === 0,
        reasons,
        warnings,
        disqualifications,
    };
};

const CAT_SELECT_SQL = `
    SELECT
        c.cat_id, c.poster_id, c.pet_name, c.pet_breed, c.gender, c.age_months, c.personality,
        c.health_note, c.req_space_level, c.req_attention, c.req_budget_level,
        c.good_with_children, c.good_with_cats, c.good_with_dogs, c.has_special_needs, c.status, c.created_at,
        u.fullname AS poster_name,
        (SELECT cp.image_url FROM catphotos AS cp WHERE cp.cat_id = c.cat_id ORDER BY cp.photo_id ASC LIMIT 1) AS image_url
    FROM cats AS c
    JOIN users AS u ON c.poster_id = u.user_id
`;

const validateProfile = (body) => {
    const{ housing_type, space_level, budget_level, attention_level, experience_level } = body;
    const errors = [];
    if(!space_level){ errors.push('กรุณาระบุระดับพื้นที่'); } else if(levelToNumber(space_level) === 0){ errors.push('ระดับพื้นที่ไม่ถูกต้อง'); }
    if (!budget_level) { errors.push('กรุณาระบุระดับงบประมาณ'); } else if (levelToNumber(budget_level) === 0) { errors.push('ระดับงบประมาณไม่ถูกต้อง'); }
    if (!attention_level) { errors.push('กรุณาระบุระดับเวลาดูแล'); } else if (levelToNumber(attention_level) === 0) { errors.push('ระดับเวลาดูแลไม่ถูกต้อง'); }
    if (!experience_level) { errors.push('กรุณาระบุระดับประสบการณ์'); } else if (levelToNumber(experience_level) === 0) { errors.push('ระดับประสบการณ์ไม่ถูกต้อง'); }

    const booleanFields = {
        pets_allowed: 'กรุณาระบุว่าที่พักอนุญาตให้เลี้ยงแมวหรือไม่',
        has_children: 'กรุณาระบุว่าในบ้านมีเด็กเล็กหรือไม่',
        has_cats: 'กรุณาระบุว่าในบ้านมีแมวตัวอื่นหรือไม่',
        has_dogs: 'กรุณาระบุว่าในบ้านมีสุนัขหรือไม่',
        has_severe_allergy: 'กรุณาระบุว่ามีสมาชิกแพ้ขนแมวรุนแรงหรือไม่',
        accepts_special_needs: 'กรุณาระบุว่าพร้อมดูแลแมวที่ต้องการการดูแลพิเศษหรือไม่',
    };
    const normalizedBooleans = {};
    for (const [fieldName, errorMessage] of Object.entries(booleanFields)) {
        const normalizedValue = normalizeBoolean(body[fieldName]);
        if (normalizedValue === null) { errors.push(errorMessage); } else { normalizedBooleans[fieldName] = normalizedValue; }
    }
    return{
        errors,
        profile:{
            housing_type: housing_type || null, space_level, budget_level,
            attention_level, experience_level, ...normalizedBooleans,
        },
    };
};

const convertMatchLevelToDatabase = (score) => {
    if(score >= 80) return 'highly_suitable';
    if(score >= 60) return 'suitable';
    if(score >= 40) return 'consider';
    return 'not_suitable';
};

const saveAssessmentDetail = async({
    assessmentId, detail, applicantValue, requireValue, explanation
}) => {
    if(!detail.criteria_id) return;
    await pool.query(`
        INSERT INTO assessment_details (
            assessment_id, criteria_id, applicant_value, required_value, weight_used, score_ratio_used, max_score, score_received, stars, passed, explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        assessmentId, detail.criteria_id, String(applicantValue), String(requireValue), detail.max_score, detail.score_ratio, detail.max_score, detail.score, detail.stars, detail.passed !== undefined ? (detail.passed ? 1 : 0) : (detail.score > 0 ? 1 : 0), explanation,
    ]);
};


// === รวมระบบ matchSelectedCat จาก main + api ===
const matchSelectedCat = async (req, res) => {
    try {
        const catId = req.params.catId;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

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

        // กฎจากฝั่ง api: เจ้าของแมวห้ามประเมินตัวเอง
        if (Number(userId) === Number(cat.poster_id)) {
            return res.status(400).json({
                success: false,
                message: 'เจ้าของแมวไม่สามารถทำแบบประเมินแมวของตนเองได้',
            });
        }

        // 3. Map profile to evaluateCat format
        const evaluateProfile = {
            housing_type: profile.living_space_type,
            space_level: profile.space_size,
            budget_level: profile.max_monthly_budget,
            attention_level: profile.daily_free_hours,
            experience_level: profile.experience,
            has_other_pets: profile.has_other_pets,
            has_children: profile.has_children,
            pets_allowed: true,
            has_cats: (profile.has_other_pets === 1),
            has_dogs: false,
            has_severe_allergy: false,
            accepts_special_needs: false,
        };

        const [criteriaRows] = await pool.query(`SELECT * FROM evaluation_criteria WHERE is_active = 1`);
        const criteriaByCode = groupCriteriaByCode(criteriaRows);

        // 4. Evaluate using the exact same logic as matchAllCats
        const evaluation = evaluateCat(evaluateProfile, cat, criteriaByCode);
        const totalScore = evaluation.match_percentage; // use percentage
        const stars = {
            space: evaluation.score_detail.space.stars,
            time: evaluation.score_detail.attention.stars, // attention maps to time for frontend
            budget: evaluation.score_detail.budget.stars,
            experience: evaluation.score_detail.experience.stars
        };

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

        // Save Details (Only for successful scores, using the criteria_id from evaluation)
        const detailsToSave = [];
        if(evaluation.score_detail.space.criteria_id) detailsToSave.push({ id: evaluation.score_detail.space.criteria_id, score: evaluation.score_detail.space.score, exp: 'Space Match', max_score: evaluation.score_detail.space.max_score, score_ratio: evaluation.score_detail.space.score_ratio, stars: evaluation.score_detail.space.stars });
        if(evaluation.score_detail.budget.criteria_id) detailsToSave.push({ id: evaluation.score_detail.budget.criteria_id, score: evaluation.score_detail.budget.score, exp: 'Budget Match', max_score: evaluation.score_detail.budget.max_score, score_ratio: evaluation.score_detail.budget.score_ratio, stars: evaluation.score_detail.budget.stars });
        if(evaluation.score_detail.attention.criteria_id) detailsToSave.push({ id: evaluation.score_detail.attention.criteria_id, score: evaluation.score_detail.attention.score, exp: 'Time Match', max_score: evaluation.score_detail.attention.max_score, score_ratio: evaluation.score_detail.attention.score_ratio, stars: evaluation.score_detail.attention.stars });
        if(evaluation.score_detail.experience.criteria_id) detailsToSave.push({ id: evaluation.score_detail.experience.criteria_id, score: evaluation.score_detail.experience.score, exp: 'Experience Match', max_score: evaluation.score_detail.experience.max_score, score_ratio: evaluation.score_detail.experience.score_ratio, stars: evaluation.score_detail.experience.stars });

        for (let d of detailsToSave) {
            await pool.query(`
                INSERT INTO assessment_details (
                    assessment_id, criteria_id, applicant_value, required_value, weight_used, score_ratio_used, max_score, score_received, stars, passed, explanation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [assessmentId, d.id, 'evaluated', 'evaluated', d.max_score, d.score_ratio, d.max_score, d.score, d.stars, d.score > 0 ? 1 : 0, d.exp]);
        }

        return res.status(200).json({
            success: true,
            message: 'ประเมินสำเร็จ',
            data: {
                assessmentId: assessmentId,
                matchPercent: totalScore,
                scores: stars
            }
        });
    } catch (error) {
        console.error('Matching Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// === matchAllCats คงฟังก์ชันของ api ไว้ใช้งาน ===
const matchAllCats = async (req, res) => {
    try {
        const { errors, profile } = validateProfile(req.body);

        if(errors.length > 0){
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลแบบประเมินไม่ถูกต้อง',
                errors,
            });
        }

        const applicantId = req.user?.user_id ?? req.body?.applicant_id;

        let query = `   
            ${CAT_SELECT_SQL}
            WHERE c.status = 'available'
        `;
        const queryParams = [];

        if (applicantId) {
            query += ` AND c.poster_id != ?`;
            queryParams.push(applicantId);
        }

        query += ` ORDER BY c.created_at DESC`;

        const [cats] = await pool.query(query, queryParams);

        const criteriaRows = await getActiveCriteria();

        if(criteriaRows.length === 0){
            return res.status(500).json({
                success: false,
                message: 'ยังไม่มีเกณฑ์ประเมินที่เปิดใช้งาน',
            });
        };

        const criteriaByCode = groupCriteriaByCode(criteriaRows);

        const matches = cats
            .map((cat) => evaluateCat(profile, cat, criteriaByCode))
            .sort((firstCat, secondCat) => {
                if(firstCat.eligible !== secondCat.eligible){
                    return firstCat.eligible ? -1 : 1;
                }
                return(
                    secondCat.match_percentage -
                    firstCat.match_percentage
                );
            });

        return res.status(200).json({
            success: true,
            message: 'ประเมินความเหมาะสมสำเร็จ',
            assessment: profile,
            count: matches.length,
            data: matches,
        });
    } catch (error){
        console.error('Matching all cats error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการประเมินความเหมาะสม',
            error: error.message,
        });
    }
};

module.exports = {
    matchSelectedCat,
    matchAllCats,
};
