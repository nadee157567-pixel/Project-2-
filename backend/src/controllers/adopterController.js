const pool = require('../config/database');

async function createAdopterProfile(req, res) {
    try {
        const {
            userId,
            housingType,
            spaceSize,
            hasPets,
            freeTime,
            experience,
            hasChildren,
            budget
        } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

        // Data Mapping
        let living_space_type = 'house';
        let space_size = 'medium';
        if (housingType === 'คอนโด') { living_space_type = 'condo'; }
        else if (housingType === 'หอพัก') { living_space_type = 'apartment'; }
        else if (housingType === 'บ้านเดี่ยว') { living_space_type = 'house'; }

        if (spaceSize === 'กว้างขวาง' || spaceSize === 'large') space_size = 'large';
        else if (spaceSize === 'คับแคบ' || spaceSize === 'small') space_size = 'small';
        else if (spaceSize === 'ปานกลาง' || spaceSize === 'medium') space_size = 'medium';

        const has_other_pets = hasPets === 'มี' ? 1 : 0;
        const has_children_mapped = hasChildren === 'มี' ? 1 : 0;

        let daily_free_hours = 'medium'; // default
        if (freeTime === 'low' || freeTime === 'น้อย') daily_free_hours = 'low';
        else if (freeTime === 'high' || freeTime === 'มาก') daily_free_hours = 'high';

        // experience: UI ส่งมาเป็นภาษาไทย แล้ว backend แปลงเป็น low/medium/high
        let exp_mapped = 'low'; // default: มือใหม่ / ไม่มี
        if (experience === 'พื้นฐาน') exp_mapped = 'medium';
        else if (experience === 'ระดับสูง') exp_mapped = 'high';

        let max_monthly_budget = 3000; // default
        if (budget === 'low' || budget === 'น้อย') max_monthly_budget = 1000;
        else if (budget === 'high' || budget === 'มาก') max_monthly_budget = 5000;
        else if (budget === 'medium' || budget === 'ปานกลาง') max_monthly_budget = 3000;
        else if (!Number.isNaN(Number(budget)) && Number(budget) > 0) {
            max_monthly_budget = Number(budget);
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
            `, [living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children_mapped, exp_mapped, userId]);
        } else {
            // Insert new
            const [result] = await pool.query(`
                INSERT INTO user_profiles 
                (user_id, living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children, experience)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children_mapped, exp_mapped]);
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
