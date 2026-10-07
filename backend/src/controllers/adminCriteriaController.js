const pool = require('../config/database');

//ดึงเกณฑ์การประเมินทั้งหมด
async function getAllCriteria(req, res) {
    try {
        const [criteria] = await pool.query(
            `SELECT c.*, u.username AS admin_name
             FROM evaluation_criteria c
             LEFT JOIN users u ON c.admin_id = u.user_id
             ORDER BY c.profile_field ASC, c.max_score DESC`
        );
        return res.status(200).json({ success: true, data: criteria });
    } catch (error) {
        console.error('getAllCriteria error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลเกณฑ์การประเมินได้' })
    }
}

// เพิ่มเกณฑ์การประเมิน
async function createCriteria(req, res) {
    try {
        const { profile_field, condition_value, max_score } = req.body;
        const adminId = req.user.user_id;

        if (!profile_field || !condition_value || max_score == null) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
        }

        const [result] = await pool.query(
            `INSERT INTO evaluation_criteria (admin_id, profile_field, condition_value, max_score) VALUES (?, ?, ?, ?)`,
            [adminId, profile_field, condition_value, max_score]
        );

        return res.status(200).json({ success: true, message: 'เพิ่มเกณฑ์การประเมินสำเร็จ', data: result.insertId });
    } catch (error) {
        console.error('createCriteria error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถเพิ่มเกณฑ์การประเมินได้' })
    }
}

//แก่ไขเกณฑ์การประเมิน
async function updateCriteria(req, res) {
    try {
        const criteria_id = req.params.id;
        const { profile_field, condition_value, max_score } = req.body;
        const adminId = req.user.user_id;

        const [result] = await pool.query(
            `UPDATE evaluation_criteria SET admin_id = ?, profile_field = ?, condition_value = ?, max_score = ? WHERE criteria_id = ?`,
            [adminId, profile_field, condition_value, max_score, criteria_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบเกณฑ์การประเมินที่ต้องการแก่ไข' });
        }

        return res.status(200).json({ success: true, message: 'แก่ไขเกณฑ์การประเมินสำเร็จ' });
    } catch (error) {
        console.error('updateCriteria error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถแก่ไขเกณฑ์การประเมินได้' })
    }
}

//ลบเกณฑ์การประเมิน
async function deleteCriteria(req, res) {
    try {
        const criteria_id = req.params.id;
        const [result] = await pool.query(
            `DELETE FROM evaluation_criteria WHERE criteria_id = ?`,
            [criteria_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบเกณฑ์การประเมินที่ต้องการลบ' });
        }

        return res.status(200).json({ success: true, message: 'ลบเกณฑ์การประเมินสำเร็จ' });
    } catch (error) {
        console.error('deleteCriteria error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถลบเกณฑ์การประเมินได้' })
    }
}

//เปิด/ปิดใช้งานเกณฑ์การประเมิน
async function toggleCriteria(req, res) {
    try {
        const criteria_id = req.params.id;
        const { is_active } = req.body;
        const adminId = req.user.user_id;

        const [result] = await pool.query(
            `UPDATE evaluation_criteria SET admin_id = ?, is_active = ? WHERE criteria_id = ?`,
            [adminId, is_active, criteria_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบเกณฑ์การประเมินที่ต้องการเปิด/ปิด' });
        }

        return res.status(200).json({ success: true, message: 'เปิด/ปิดเกณฑ์การประเมินสำเร็จ' });
    } catch (error) {
        console.error('toggleCriteria error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถเปิด/ปิดเกณฑ์การประเมินได้' })
    }
}

module.exports = {
    getAllCriteria,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    toggleCriteria
};