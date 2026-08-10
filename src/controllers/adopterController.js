const pool = require('../config/database');

async function createAdopterProfile(req, res) {
    try {
        const {
            userId,
            housingType,
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
        if (housingType === 'คอนโด') { living_space_type = 'condo'; space_size = 'medium'; }
        else if (housingType === 'หอพัก') { living_space_type = 'apartment'; space_size = 'small'; }
        else if (housingType === 'บ้านเดี่ยว') { living_space_type = 'house'; space_size = 'large'; }

        const has_other_pets = hasPets === 'มี' ? 1 : 0;
        const has_children_mapped = hasChildren === 'มี' ? 1 : 0;

        let freeTimeMapped = 'medium';
        if (freeTime === 'น้อย' || freeTime === 'low') freeTimeMapped = 'low';
        else if (freeTime === 'มาก' || freeTime === 'high') freeTimeMapped = 'high';
        else if (freeTime === 'ปานกลาง' || freeTime === 'medium') freeTimeMapped = 'medium';
        let daily_free_hours = freeTimeMapped;

        let exp_mapped = 'none';
        if (experience === 'พื้นฐาน' || experience === 'beginner') exp_mapped = 'beginner';
        else if (experience === 'ระดับสูง' || experience === 'experienced') exp_mapped = 'experienced';

        let budgetMapped = 'medium';
        if (budget === 'น้อย' || budget === 'low') budgetMapped = 'low';
        else if (budget === 'มาก' || budget === 'high') budgetMapped = 'high';
        else if (budget === 'ปานกลาง' || budget === 'medium') budgetMapped = 'medium';
        let max_monthly_budget = budgetMapped;

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
            housingType,
            hasPets,
            freeTime,
            experience,
            hasChildren,
            budget
        } = req.body;

        // Data Mapping
        let living_space_type = 'house';
        let space_size = 'medium';
        if (housingType === 'คอนโด') { living_space_type = 'condo'; space_size = 'medium'; }
        else if (housingType === 'หอพัก') { living_space_type = 'apartment'; space_size = 'small'; }
        else if (housingType === 'บ้านเดี่ยว') { living_space_type = 'house'; space_size = 'large'; }

        const has_other_pets = hasPets === 'มี' ? 1 : 0;
        const has_children_mapped = hasChildren === 'มี' ? 1 : 0;

        let daily_free_hours = ['low', 'medium', 'high'].includes(freeTime) ? freeTime : 'medium';

        let exp_mapped = 'none';
        if (experience === 'พื้นฐาน') exp_mapped = 'beginner';
        else if (experience === 'ระดับสูง') exp_mapped = 'experienced';

        let max_monthly_budget = ['low', 'medium', 'high'].includes(budget) ? budget : 'medium';

        const [result] = await pool.query(`
            UPDATE user_profiles 
            SET living_space_type = ?, space_size = ?, max_monthly_budget = ?, daily_free_hours = ?, has_other_pets = ?, has_children = ?, experience = ?
            WHERE user_id = ?
        `, [living_space_type, space_size, max_monthly_budget, daily_free_hours, has_other_pets, has_children_mapped, exp_mapped, userId]);

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
