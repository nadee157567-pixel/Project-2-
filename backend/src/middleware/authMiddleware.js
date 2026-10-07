const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'ไม่พบ Token การเข้าถึง หรือรูปแบบ Token ไม่ถูกต้อง'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // ตรวจสอบความถูกต้องของ Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ตรวจสอบสถานะการระงับบัญชีในฐานข้อมูล (กรณีถูกระงับระหว่างใช้งาน)
        if (decoded.user_id && decoded.role !== 'admin') {
            try {
                const [userRows] = await pool.query('SELECT is_banned, ban_reason FROM users WHERE user_id = ?', [decoded.user_id]);
                if (userRows.length > 0 && Number(userRows[0].is_banned) === 1) {
                    const reasonText = userRows[0].ban_reason ? ` (${userRows[0].ban_reason})` : '';
                    return res.status(403).json({
                        success: false,
                        is_banned: true,
                        message: `บัญชีของคุณถูกระงับการใช้งาน${reasonText} กรุณาติดต่อผู้ดูแลระบบ`
                    });
                }
            } catch (dbErr) {
                console.error('Error checking user ban status in middleware:', dbErr);
            }
        }

        // นำข้อมูลผู้ใช้ (user_id, username, role) แนบไปกับ request
        req.user = decoded;

        // ไปยัง API ถัดไป
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Token ไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่'
        });
    }
}

// ตรวจสอบว่าเป็น Admin
function verifyAdmin(req, res, next) {
    // หลังจาก verifyToken จะมี req.user 
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ (Admin only)'
        });
    }
}

// // Middleware สำหรับตรวจสอบว่าเป็น Adopter
// function verifyAdopter(req, res, next) {
//     if (!req.user || req.user.role !== 'adopter') {
//         return res.status(403).json({ 
//             success: false, 
//             message: 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ (Adopter only)' 
//         });
//     }
//     next();
// }

module.exports = {
    verifyToken,
    verifyAdmin,
    // verifyAdopter
};
