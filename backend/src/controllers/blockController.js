const pool = require('../config/database');

exports.blockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;

        if (!blockerId || !blockedId) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        // Insert ignore duplicate
        await pool.query(
            'INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, blockedId]
        );

        res.status(200).json({ success: true, message: 'Blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ success: false, message: 'Failed to block user' });
    }
};

exports.getBlockedUsers = async (req, res) => {
    try {
        const { userId } = req.params;
        const [blockedUsers] = await pool.query(`
            SELECT b.blocked_id, u.fullname, u.username
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.user_id
            WHERE b.blocker_id = ?
        `, [userId]);
        res.status(200).json({ success: true, data: blockedUsers });
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blocked users' });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.params;
        await pool.query(
            'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );
        res.status(200).json({ success: true, message: 'Unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ success: false, message: 'Failed to unblock user' });
    }
};
