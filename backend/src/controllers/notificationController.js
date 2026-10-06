const pool = require('../config/database');

// ดึงรายการแจ้งเตือนทั้งหมดของ User
exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        const [notifications] = await pool.query(`
            SELECT n.*, 
                   a.cat_id, 
                   c.pet_name, 
                   c.status AS cat_status
            FROM notifications n
            LEFT JOIN adoptionapplications a ON n.related_id = a.match_id AND n.type IN ('adoption_request', 'adoption_status')
            LEFT JOIN cats c ON a.cat_id = c.cat_id
            WHERE n.user_id = ? 
            ORDER BY n.created_at DESC
        `, [userId]);

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน และจำนวนแชทที่ยังไม่ได้อ่าน
exports.getUnreadCounts = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Unread notifications
        const [notifResult] = await pool.query(`
            SELECT COUNT(*) AS unreadNotifications 
            FROM notifications 
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        // 2. Unread chats
        const [chatResult] = await pool.query(`
            SELECT COUNT(m.message_id) AS unreadChats
            FROM messages m
            JOIN conversations c ON m.room_id = c.room_id
            JOIN adoptionapplications aa ON c.match_id = aa.match_id
            JOIN cats cat ON aa.cat_id = cat.cat_id
            WHERE (aa.applicant_id = ? OR cat.poster_id = ?)
              AND m.sender_id != ?
              AND m.is_read = 0
              AND aa.applicant_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)
              AND cat.poster_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)
        `, [userId, userId, userId, userId, userId]);

        res.status(200).json({ 
            success: true, 
            unreadNotifications: notifResult[0].unreadNotifications,
            unreadChats: chatResult[0].unreadChats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// อัปเดตสถานะการอ่าน
exports.markAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        await pool.query(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        res.status(200).json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
