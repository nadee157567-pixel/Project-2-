const pool = require('../config/database');

//ดึงข้อมูลแมวทั้งหมด
async function getAllAdminCats(req, res) {
    try {
        const [cats] = await pool.query(`
            SELECT 
                c.*, 
                u.fullname AS poster_name,
                u.username AS poster_username,
                (
                    SELECT cp.image_url 
                    FROM catphotos AS cp 
                    WHERE cp.cat_id = c.cat_id 
                    ORDER BY cp.photo_id ASC 
                    LIMIT 1
                ) AS image_url
            FROM cats AS c
            JOIN users AS u ON c.poster_id = u.user_id
            ORDER BY c.created_at DESC
        `);
        return res.status(200).json({ success: true, count: cats.length, data: cats });
    } catch (error) {
        console.error('getAllAdminCats error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลโพสต์แมวได้' })
    }
}

//ซ่อนโพสต์แมว
async function hideCatPost(req, res) {
    try {
        const cat_id = req.params.id;
        const [result] = await pool.query(
            `UPDATE cats SET is_hidden = 1 WHERE cat_id = ?`,
            [cat_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบโพสต์แมวที่ต้องการซ่อน' });
        }

        return res.status(200).json({ success: true, message: 'ซ่อนโพสต์แมวสำเร็จ' });
    } catch (error) {
        console.error('hideCat error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถซ่อนโพสต์แมวได้' })
    }
}

//เลิกซ่อนโพสต์แมว
async function unhideCatPost(req, res) {
    try {
        const cat_id = req.params.id;
        const [result] = await pool.query(
            `UPDATE cats SET is_hidden = 0 WHERE cat_id = ?`,
            [cat_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบโพสต์แมวที่ต้องการแสดง' });
        }

        return res.status(200).json({ success: true, message: 'แสดงโพสต์แมวสำเร็จ' });
    } catch (error) {
        console.error('showCat error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถแสดงโพสต์แมวได้' })
    }
}

//ลบโพสต์แมวถาวร (กรณีทำผิดร้ายแรง เช่น ลงรูปภาพไม่เหมาะสม, ข้อมูลเท็จ )
async function deleteCatPost(req, res) {
    const conn = await pool.getConnection();
    try {
        const cat_id = req.params.id;

        // ตรวจสอบว่ามีแมวตัวนี้อยู่หรือไม่
        const [checkCat] = await conn.query('SELECT * FROM cats WHERE cat_id = ?', [cat_id]);
        if (checkCat.length === 0) {
            conn.release();
            return res.status(404).json({ success: false, message: 'ไม่พบโพสต์แมวที่ต้องการลบ' });
        }

        const catName = checkCat[0].pet_name || `แมว #${cat_id}`;

        await conn.beginTransaction();

        // 1. ดึงรายการ match_id ของคำขอรับเลี้ยงที่ผูกกับแมวตัวนี้
        const [apps] = await conn.query('SELECT match_id FROM adoptionapplications WHERE cat_id = ?', [cat_id]);
        if (apps.length > 0) {
            const matchIds = apps.map(a => a.match_id);

            // 1.1 ลบข้อความและห้องแชทที่ผูกกับคำขอรับเลี้ยง
            const [rooms] = await conn.query('SELECT room_id FROM conversations WHERE match_id IN (?)', [matchIds]);
            if (rooms.length > 0) {
                const roomIds = rooms.map(r => r.room_id);
                await conn.query('DELETE FROM messages WHERE room_id IN (?)', [roomIds]);
                await conn.query('DELETE FROM conversations WHERE room_id IN (?)', [roomIds]);
            }

            // 1.2 ลบการอนุมัติรับเลี้ยง
            await conn.query('DELETE FROM adoption_approvals WHERE match_id IN (?)', [matchIds]);

            // 1.3 ลบคำขอรับเลี้ยง
            await conn.query('DELETE FROM adoptionapplications WHERE cat_id = ?', [cat_id]);
        }

        // 2. ลบแบบประเมินบ้าน (assessments) และรายละเอียด (assessment_details)
        const [assessments] = await conn.query('SELECT assessment_id FROM assessments WHERE cat_id = ?', [cat_id]);
        if (assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.assessment_id);
            await conn.query('DELETE FROM assessment_details WHERE assessment_id IN (?)', [assessmentIds]);
            await conn.query('DELETE FROM assessments WHERE cat_id = ?', [cat_id]);
        }

        // 3. ลบรูปถ่ายแมว (catphotos)
        await conn.query('DELETE FROM catphotos WHERE cat_id = ?', [cat_id]);

        // 4. ลบโพสต์แมว (cats)
        await conn.query('DELETE FROM cats WHERE cat_id = ?', [cat_id]);

        // 5. บันทึก Admin Log
        const adminId = req.user ? req.user.user_id : 1;
        const details = `ลบประกาศแมว ID ${cat_id} (${catName}) และข้อมูลที่เกี่ยวข้องทั้งหมดออกจากระบบ`;
        await conn.query(
            'INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)',
            [adminId, 'DELETE_CAT', details]
        );

        await conn.commit();
        conn.release();

        return res.status(200).json({ success: true, message: `ลบโพสต์แมว "${catName}" ออกจากระบบถาวรสำเร็จ` });
    } catch (error) {
        await conn.rollback();
        conn.release();
        console.error('deleteCat error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถลบโพสต์แมวได้: ' + error.message });
    }
}

module.exports = {
    getAllAdminCats,
    hideCatPost,
    unhideCatPost,
    deleteCatPost
};
