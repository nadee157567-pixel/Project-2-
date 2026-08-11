const pool = require('../config/database');

async function createAdopterProfile(req, res) {
    try {
        const {
            userId,
            living_space_type,
            space_size,
            has_other_pets,
            daily_free_hours,
            experience,
            has_children,
            max_monthly_budget
        } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

        // Insert into user_profiles
        // First check if profile already exists for this user
        const [existing] = await pool.query('SELECT profile_id FROM user_profiles WHERE user_id = ?', [userId]);

        let profileId;
        if (existing.length > 0) {
            // Update existing
            profileId = existing[0].profile_id;
            await pool.query(`
                UPDATE user_profiles 
                SET living_space_type = ?, space_size = ?, max_monthly_budget = ?, daily_free_hours = ?, has_other_pets = ?, has_children = ?, experience = ?
                WHERE user_id = ?
            `, [living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience, userId]);
        } else {
            // Insert new
            const [result] = await pool.query(`
                INSERT INTO user_profiles 
                (user_id, living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience]);
            profileId = result.insertId;
        }

        return res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลผู้รับเลี้ยงสำเร็จ',
            profileId
        });

    } catch (error) {
        console.error('createAdopterProfile error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถบันทึกข้อมูลผู้รับเลี้ยงได้'
        });
    }
}

async function getAdopterProfile(req, res) {
    try {
        const userId = req.params.userId;
        const [existing] = await pool.query('SELECT profile_id FROM user_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            return res.status(200).json({
                success: true,
                exists: true,
                profileId: existing[0].profile_id
            });
        } else {
            return res.status(200).json({
                success: true,
                exists: false
            });
        }
    } catch (error) {
        console.error('getAdopterProfile error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถตรวจสอบโปรไฟล์ผู้รับเลี้ยงได้'
        });
    }
}

async function getAdopterProfileDetails(req, res) {
    try {
        const userId = req.params.userId;
        const [existing] = await pool.query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            return res.status(200).json({
                success: true,
                profile: existing[0]
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลโปรไฟล์ผู้รับเลี้ยง'
            });
        }
    } catch (error) {
        console.error('getAdopterProfileDetails error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้'
        });
    }
}

async function updateAdopterProfile(req, res) {
    try {
        const userId = req.params.id;
        const {
            living_space_type,
            space_size,
            max_monthly_budget,
            daily_free_hours,
            has_other_pets,
            has_children,
            experience
        } = req.body;

        const [result] = await pool.query(`
            UPDATE user_profiles 
            SET living_space_type = ?, space_size = ?, max_monthly_budget = ?, daily_free_hours = ?, has_other_pets = ?, has_children = ?, experience = ?
            WHERE user_id = ?
        `, [living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบโปรไฟล์ผู้รับเลี้ยง' });
        }

        return res.status(200).json({
            success: true,
            message: 'อัปเดตข้อมูลแบบประเมินสำเร็จ'
        });

    } catch (error) {
        console.error('updateAdopterProfile error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลแบบประเมินได้' });
    }
}

module.exports = {
    createAdopterProfile,
    getAdopterProfile,
    getAdopterProfileDetails,
    updateAdopterProfile
};
