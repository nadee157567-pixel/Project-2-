const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function signup(req, res) {
    try {
        const { username, email, phone, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว' });
        }

        // สร้างรหัสผ่านที่เข้ารหัส
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // เพิ่มผู้ใช้ใหม่ โดยกำหนด role เริ่มต้นเป็น 'user' และ fullname ใช้ username ไปก่อน
        const [result] = await pool.query(
            'INSERT INTO users (username, email, phonenumber, password, fullname, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, phone || null, hashedPassword, username, 'user']
        );

        return res.status(201).json({
            success: true,
            message: 'สมัครสมาชิกสำเร็จ',
            userId: result.insertId,
            role: 'user'
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Password' });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
        }

        const user = users[0];

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
        }

        // สร้าง JWT Token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // ตรวจสอบความถูกต้องของเบอร์โทรศัพท์
        let requireProfileUpdate = false;
        let warningMessage = null;
        
        if (!user.phonenumber || user.phonenumber.length !== 10 || !/^\d{10}$/.test(user.phonenumber)) {
            requireProfileUpdate = true;
            warningMessage = 'เบอร์โทรศัพท์ของคุณไม่ถูกต้องหรือยังไม่ได้ระบุ กรุณาอัปเดตข้อมูลส่วนตัว (เบอร์โทร 10 หลัก) เพื่อให้ใช้งานระบบได้สมบูรณ์';
        }

        return res.status(200).json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            userId: user.user_id,
            username: user.username,
            role: user.role,
            token: token,
            requireProfileUpdate: requireProfileUpdate,
            warningMessage: warningMessage
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
}

async function getUserById(req, res) {
    try {
        const userId = req.params.id;
        const [users] = await pool.query(
            'SELECT user_id, username, email, phonenumber, fullname, role, created_at FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
        }

        return res.status(200).json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('getUserById error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
}

async function updateUser(req, res) {
    try {
        const userId = req.params.id;
        const { fullname, phonenumber, line_id, profile_pic_url } = req.body;

        if (!fullname || !phonenumber || !line_id || !profile_pic_url) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const [result] = await pool.query(
            'UPDATE users SET fullname = ?, phonenumber = ?, line_id = ?, profile_pic_url = ? WHERE user_id = ?',
            [fullname, phonenumber, line_id, profile_pic_url, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
        }

        return res.status(200).json({
            success: true,
            message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
            data: {
                user_id: userId,
                fullname,
                phonenumber,
                line_id,
                profile_pic_url
            }
        });
    } catch (error) {
        console.error('updateUser error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้' });
    }
}

async function updateAdopterProfile(req, res) {
    try {
        const userId = req.params.id;
        const {
            house_type,
            housing_area,
            pet_experience,

        } = req.body;

    } catch (error) {
        console.error('updateAdopterProfile error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้' });
    }
}

module.exports = {
    signup,
    login,
    getUserById,
    updateUser,

};
