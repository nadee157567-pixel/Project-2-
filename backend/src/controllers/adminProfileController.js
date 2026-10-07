const pool = require('../config/database');

//ดึงข้อมูลผู้ดูแลระบบ
async function getAdminProfile(req, res) {
    try {
        const userId = req.user.user_id;
        const [profile] = await pool.query(`SELECT * FROM users WHERE user_id = ?`, [userId]);
        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('getAdminProfile error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้' });
    }
}

module.exports = {
    getAdminProfile,
}