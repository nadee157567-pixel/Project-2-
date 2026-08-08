const pool = require('../config/database');

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

        // เพิ่มผู้ใช้ใหม่ โดยกำหนด role เริ่มต้นเป็น 'user' และ fullname ใช้ username ไปก่อน
        const [result] = await pool.query(
            'INSERT INTO users (username, email, phonenumber, password, fullname, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, phone || null, password, username, 'user']
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
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
        }

        const user = users[0];

        return res.status(200).json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            userId: user.user_id,
            username: user.username,
            role: user.role
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
        const { username, email, phonenumber, oldPassword, newPassword, otp } = req.body;

        if (!username || !email) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูล Username และ Email ให้ครบถ้วน' });
        }

        // ตรวจสอบว่า email หรือ username ซ้ำกับคนอื่นหรือไม่ (ยกเว้นตัวเอง)
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
            [username, email, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Username หรือ Email นี้มีผู้ใช้งานแล้ว' });
        }

        // ดึงข้อมูลผู้ใช้ปัจจุบันเพื่อเปรียบเทียบรหัสผ่าน
        const [currentUser] = await pool.query('SELECT password FROM users WHERE user_id = ?', [userId]);
        if (currentUser.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
        }

        let updatePassword = currentUser[0].password; // default to old password

        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (newPassword && newPassword.trim() !== '') {
            if (otp && otp === '123456') {
                // ใช้ OTP ผ่าน
                updatePassword = newPassword;
            } else if (otp && otp !== '123456') {
                return res.status(400).json({ success: false, message: 'OTP ไม่ถูกต้อง' });
            } else if (oldPassword && oldPassword === currentUser[0].password) {
                // รหัสผ่านเดิมถูกต้อง
                updatePassword = newPassword;
            } else {
                return res.status(400).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง หรือไม่ได้ระบุ OTP' });
            }
        }

        await pool.query(
            'UPDATE users SET username = ?, email = ?, phonenumber = ?, password = ? WHERE user_id = ?',
            [username, email, phonenumber || null, updatePassword, userId]
        );

        return res.status(200).json({
            success: true,
            message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ'
        });

    } catch (error) {
        console.error('updateUser error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
}

module.exports = {
    signup,
    login,
    getUserById,
    updateUser
};
