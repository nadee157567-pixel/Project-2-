const pool = require('../config/database');

exports.createRoom = async (req, res) => {
    try {
        const { matchId } = req.body;

        if (!matchId) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลให้ครบถ้วน' });
        }

        const [room] = await pool.query(`
            SELECT * FROM conversations WHERE match_id = ?
        `, [matchId]);

        if (room.length > 0) {
            return res.status(400).json({ success: false, message: 'ห้องแชทนี้มีอยู่แล้ว' });
        }

        const [result] = await pool.query(`
            INSERT INTO conversations (match_id)
            VALUES (?) 
        `, [matchId]);

        res.status(201).json({ success: true, message: 'สร้างห้องแชทสำเร็จ', roomId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

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
                aa.status AS application_status,
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


exports.sendMessage = async (req, res) => {
    try {
        const { roomId, senderId, messageText } = req.body;

        if (!roomId || !senderId || !messageText) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลให้ครบถ้วน' });
        }

        const [result] = await pool.query(`
            INSERT INTO messages (room_id, sender_id, message_text, is_read)
            VALUES (?, ?, ?, 0)
        `, [roomId, senderId, messageText]);

        const [newMessage] = await pool.query(`
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
            WHERE m.message_id = ?
            `, [result.insertId]);

        // Optional: Update last_message_at in conversations table here

        const socket = require('../socket');
        socket.to(`chat-${roomId}`).emit('receive_message', newMessage[0]); // changed to receive_message to match flutter

        res.status(201).json({ success: true, message: 'ส่งข้อความสำเร็จ', data: newMessage[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateIsRead = async (req, res) => {
    try {
        const { roomId } = req.params;

        const { userId } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลให้ครบถ้วน' });
        }

        const [result] = await pool.query(`
            UPDATE messages SET is_read = 1 WHERE room_id = ? AND sender_id != ? AND is_read = 0
        `, [roomId, userId]);

        if (result.affectedRows > 0) {
            const socket = require('../socket');
            socket.to(`chat-${roomId}`).emit('message_read', {
                roomId,
                userId
            });
        }

        res.status(200).json({ success: true, message: 'อัปเดตสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ roomId' });
        }

        // 1. Delete messages first due to foreign key constraint
        await pool.query('DELETE FROM messages WHERE room_id = ?', [roomId]);
        
        // 2. Delete the conversation room
        await pool.query('DELETE FROM conversations WHERE room_id = ?', [roomId]);

        res.status(200).json({ success: true, message: 'ลบแชทสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
