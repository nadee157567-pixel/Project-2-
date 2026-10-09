const pool = require('../config/database');

// ดึงข้อมูลผู้ใช้ทั้งหมด (เฉพาะ role = 'user')
async function getAllUsers(req, res) {
    try {
        const [users] = await pool.query(`
            SELECT 
                u.user_id, u.email, u.fullname, u.username, u.phonenumber, u.line_id,
                u.role, u.is_banned, u.ban_reason, u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM cats c WHERE c.poster_id = u.user_id) AS posted_count,
                (SELECT COUNT(*) FROM adoptionapplications a WHERE a.applicant_id = u.user_id) AS app_count
            FROM users u
            WHERE u.role = 'user'
            ORDER BY u.created_at DESC
        `);
        return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('getAllUsers error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
}

// ค้นหาผู้ใช้ (เฉพาะ role = 'user')
async function searchUsers(req, res) {
    try {
        const { search } = req.query;
        const [users] = await pool.query(`
            SELECT 
                user_id, email, fullname, username, phonenumber, line_id,
                role, is_banned, ban_reason, created_at, updated_at
            FROM users 
            WHERE role = 'user' AND (fullname LIKE ? OR username LIKE ? OR email LIKE ?)
            ORDER BY created_at DESC
        `, [`%${search}%`, `%${search}%`, `%${search}%`]);
        return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('searchUsers error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถค้นหาผู้ใช้ได้' });
    }
}

// ดึงข้อมูลผู้ใช้งานรายบุคคลแบบละเอียดเชิงลึก (User Deep Dive Detail)
async function getUserById(req, res) {
    try {
        const userId = req.params.id;

        // 1. ดึงข้อมูลพื้นฐานผู้ใช้ (ยกเว้น password)
        const [users] = await pool.query(`
            SELECT 
                user_id, email, fullname, username, phonenumber, line_id,
                role, is_banned, ban_reason, created_at, updated_at
            FROM users 
            WHERE user_id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        const user = users[0];

        // 2. ดึงข้อมูลความพร้อมและสภาพแวดล้อมที่พักอาศัย (user_profiles)
        const [profiles] = await pool.query(`
            SELECT 
                profile_id, living_space_type, space_size, max_monthly_budget,
                daily_free_hours, has_other_pets, has_children, experience
            FROM user_profiles
            WHERE user_id = ?
            LIMIT 1
        `, [userId]);
        user.profile = profiles.length > 0 ? profiles[0] : null;

        // 3. ดึงรายการประกาศแมวที่ผู้ใช้คนนี้สร้างไว้ (Cats Posted)
        const [postedCats] = await pool.query(`
            SELECT 
                c.cat_id, c.pet_name, c.pet_breed, c.gender, c.age_months,
                c.status, c.is_hidden, c.created_at,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS image_url,
                (SELECT COUNT(*) FROM adoptionapplications aa WHERE aa.cat_id = c.cat_id) AS applications_count
            FROM cats c
            WHERE c.poster_id = ?
            ORDER BY c.created_at DESC
        `, [userId]);
        user.posted_cats = postedCats;

        // 4. ดึงคำขอรับเลี้ยงที่ผู้ใช้ส่งไป (Applications Sent as Applicant)
        const [applicationsSent] = await pool.query(`
            SELECT 
                aa.match_id, aa.cat_id, aa.matchscore, aa.status, aa.applied_at, aa.upload_remark,
                c.pet_name, c.pet_breed, c.status AS cat_status,
                (SELECT cp.image_url FROM catphotos cp WHERE cp.cat_id = c.cat_id LIMIT 1) AS cat_image,
                poster.user_id AS poster_id, poster.fullname AS poster_name, poster.username AS poster_username, poster.phonenumber AS poster_phone
            FROM adoptionapplications aa
            JOIN cats c ON aa.cat_id = c.cat_id
            JOIN users poster ON c.poster_id = poster.user_id
            WHERE aa.applicant_id = ?
            ORDER BY aa.applied_at DESC
        `, [userId]);
        user.applications_sent = applicationsSent;

        // 5. ดึงคำขอรับเลี้ยงที่ผู้อื่นส่งเข้ามายังแมวของผู้ใช้คนนี้ (Applications Received as Poster)
        const [applicationsReceived] = await pool.query(`
            SELECT 
                aa.match_id, aa.cat_id, aa.matchscore, aa.status, aa.applied_at,
                c.pet_name,
                applicant.user_id AS applicant_id, applicant.fullname AS applicant_name, applicant.username AS applicant_username, applicant.phonenumber AS applicant_phone
            FROM adoptionapplications aa
            JOIN cats c ON aa.cat_id = c.cat_id
            JOIN users applicant ON aa.applicant_id = applicant.user_id
            WHERE c.poster_id = ?
            ORDER BY aa.applied_at DESC
        `, [userId]);
        user.applications_received = applicationsReceived;

        // 6. ดึงประวัติการทำแบบประเมินความพร้อม (Assessments)
        const [assessments] = await pool.query(`
            SELECT 
                a.assessment_id, a.cat_id, a.total_score, a.match_percentage,
                a.suitability_level, a.recommendation, a.assessed_at,
                c.pet_name, c.pet_breed
            FROM assessments a
            JOIN cats c ON a.cat_id = c.cat_id
            WHERE a.applicant_id = ?
            ORDER BY a.assessed_at DESC
        `, [userId]);
        user.assessments = assessments;

        // 7. สรุปสถิติกิจกรรมของผู้ใช้ (Activity Summary)
        user.stats = {
            total_posted_cats: postedCats.length,
            total_adopted_cats: postedCats.filter(c => c.status === 'adopted').length,
            total_applications_sent: applicationsSent.length,
            total_applications_approved: applicationsSent.filter(a => a.status === 'approved').length,
            total_applications_received: applicationsReceived.length,
            total_assessments: assessments.length
        };

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('getUserById error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลรายละเอียดผู้ใช้ได้: ' + error.message });
    }
}

// ปรับสถานะระงับ/ยกเลิกการระงับบัญชี (Ban/Unban) พร้อมบันทึกเหตุผลและ Audit Log
async function toggleUserStatus(req, res) {
    try {
        const userId = req.params.id;
        const { is_banned, ban_reason } = req.body; // รับค่า 0 (ปกติ) หรือ 1 (ระงับ) พร้อมเหตุผล

        if (is_banned === undefined || (is_banned !== 0 && is_banned !== 1)) {
            return res.status(400).json({ success: false, message: 'ค่าสถานะไม่ถูกต้อง (ต้องเป็น 0 หรือ 1)' });
        }

        // ป้องกันไม่ให้แอดมินแบนตัวเอง
        if (req.user && userId == req.user.user_id) {
            return res.status(403).json({ success: false, message: 'ไม่สามารถระงับบัญชีของตนเองได้' });
        }

        const [existing] = await pool.query('SELECT username, fullname FROM users WHERE user_id = ?', [userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไขสถานะ' });
        }

        const targetUser = existing[0];
        const reason = is_banned === 1 ? (ban_reason || 'แอดมินระงับการใช้งาน') : null;

        await pool.query(
            `UPDATE users SET is_banned = ?, ban_reason = ?, updated_at = NOW() WHERE user_id = ?`,
            [is_banned, reason, userId]
        );

        // บันทึก Log ของแอดมิน
        try {
            const adminId = req.user ? req.user.user_id : 1;
            const action = is_banned === 1 ? 'BAN_USER' : 'UNBAN_USER';
            const logDetails = is_banned === 1
                ? `ระงับบัญชีผู้ใช้ ID ${userId} (@${targetUser.username}) เหตุผล: ${reason}`
                : `คืนสิทธิ์บัญชีผู้ใช้ ID ${userId} (@${targetUser.username})`;

            await pool.query(
                'INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)',
                [adminId, action, logDetails]
            );
        } catch (logErr) {
            console.error('Failed to log admin action:', logErr.message);
        }

        const statusMessage = is_banned === 1 ? 'ระงับบัญชีผู้ใช้สำเร็จ' : 'ยกเลิกการระงับบัญชีสำเร็จ';
        return res.status(200).json({ success: true, message: statusMessage });
    } catch (error) {
        console.error('toggleUserStatus error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถเปลี่ยนสถานะผู้ใช้งานได้: ' + error.message });
    }
}

module.exports = {
    getAllUsers,
    searchUsers,
    getUserById,
    toggleUserStatus
};
