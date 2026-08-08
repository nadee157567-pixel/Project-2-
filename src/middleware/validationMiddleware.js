// src/middleware/validationMiddleware.js

function validateSignup(req, res, next) {
    const { username, email, password, phone } = req.body;
    const errors = [];

    if (!username || username.trim().length < 3) {
        errors.push('Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('รูปแบบ Email ไม่ถูกต้อง');
    }

    if (!password || password.length < 6) {
        errors.push('Password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    if (phone && !/^\d{10}$/.test(phone)) {
        errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ถูกต้อง', errors });
    }
    next();
}

function validateCatPost(req, res, next) {
    const { pet_name, age_months, req_space_level, req_attention } = req.body;
    const errors = [];

    if (!pet_name || pet_name.trim().length === 0) {
        errors.push('กรุณาระบุชื่อแมว');
    }
    
    if (age_months !== undefined && (isNaN(age_months) || Number(age_months) < 0)) {
        errors.push('อายุของแมวต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
    }

    if (!req_space_level) {
        errors.push('กรุณาระบุระดับพื้นที่ที่ต้องการ');
    }

    if (!req_attention) {
        errors.push('กรุณาระบุระดับเวลาการดูแลที่ต้องการ');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'ข้อมูลโพสต์ไม่ถูกต้อง', errors });
    }
    next();
}

module.exports = {
    validateSignup,
    validateCatPost
};
