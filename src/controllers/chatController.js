const pool = require('../config/database');

exports.getChats = async (req, res) => {
    try {
        // ในระบบจริง ควรดึง userId จาก token (เช่น req.user.userId)
        // แต่ตอนนี้ใช้เป็น query parameter ไปก่อนเพื่อให้ง่ายต่อการทดสอบ
        const { userId } = req.query; 

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

        const [chats] = await pool.query(`
            SELECT 
                c.room_id, 
                c.match_id, 
                c.created_at,
                aa.applicant_id,
                cat.poster_id,
                cat.pet_name,
                cat.pet_breed,
                applicant.fullname AS applicant_name,
                poster.fullname AS poster_name
            FROM conversations c
            JOIN adoptionapplications aa ON c.match_id = aa.match_id
            JOIN cats cat ON aa.cat_id = cat.cat_id
            JOIN users applicant ON aa.applicant_id = applicant.user_id
            JOIN users poster ON cat.poster_id = poster.user_id
            WHERE aa.applicant_id = ? OR cat.poster_id = ?
            ORDER BY c.created_at DESC
        `, [userId, userId]);

        res.status(200).json({ success: true, data: chats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const [messages] = await pool.query(`
            SELECT 
                m.message_id, 
                m.room_id, 
                m.sender_id, 
                u.fullname AS sender_name,
                m.message_text, 
                m.is_read, 
                m.sent_at
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.room_id = ?
            ORDER BY m.sent_at ASC
        `, [roomId]);

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
