const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
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

module.exports = verifyToken;
