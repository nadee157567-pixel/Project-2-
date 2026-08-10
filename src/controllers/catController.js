const pool = require('../config/database');

// get / api / cats - ดึงรายการของแมว
async function getAllCats(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT
                c.cat_id,
                c.pet_name,
                c.pet_breed,
                c.gender,
                c.age_months,
                c.personality,
                c.health_note,
                c.req_space_level,
                c.req_attention,
                c.status,
                c.req_budget_level,
                c.good_with_children,
                c.good_with_cats,
                c.good_with_dogs,
                c.has_special_needs,
                c.created_at,
                
                u.user_id AS poster_id,
                u.fullname AS poster_name,
                (
                    SELECT cp.image_url
                    FROM catphotos AS cp
                    WHERE cp.cat_id = c.cat_id
                    ORDER BY cp.photo_id ASC
                    LIMIT 1
                ) AS image_url
            FROM cats AS c
            
            JOIN users AS u
              ON c.poster_id = u.user_id
              
            WHERE c.status != 'adopted' OR c.status IS NULL
            ORDER BY c.created_at DESC`);
        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error('getAllCats error:', error);

        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลของแมวได้'
        });
    }
}

// get / api / cats /:id - ดึงรายละเอียดของแมว 1 ตัว
async function getCatById(req, res) {
    try {
        const catId = Number(req.params.id);
        if (!Number.isInteger(catId) || catId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'รหัสของแมวไม่ถูกต้อง'
            });
        }
        const [cats] = await pool.query(`
            SELECT
                c.*,
                u.fullname AS poster_name,
                u.phonenumber AS poster_phone,
                u.line_id As poster_line_id
            FROM cats AS c
            JOIN users AS u
              ON c.poster_id = u.user_id
            WHERE c.cat_id = ?`, [catId]);

        if (cats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลแมว',
            });
        }

        const [photos] = await pool.query(
            `
            SELECT
                photo_id,
                image_url

            FROM catphotos

            WHERE cat_id = ?

            ORDER BY photo_id ASC
            `,
            [catId]
        );


        return res.status(200).json({
            success: true,
            data: {
                ...cats[0],
                photos,
            },
        });
    } catch (error) {
        console.error('getCatById error:', error);

        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงรายละเอียดของแมวได้'
        });
    }
}

async function createCat(req, res) {
    try {
        const {
            userId,
            name,
            breed,
            gender,
            ageRange,
            sterilization,
            vaccination,
            healthDetails,
            reqHousing,
            reqTime,
            reqOtherPets,
            reqBudget,
            reqExperience,
            goodWithChildren,
            goodWithCats,
            goodWithDogs,
            hasSpecialNeeds
        } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

        // Mapping values
        const pet_gender = gender === 'ผู้' ? 'male' : 'female';

        let age_months = 12; // default
        if (ageRange === 'ต่ำกว่า 2 เดือน (ยังไม่หย่านม)') age_months = 1;
        else if (ageRange === '2 - 6 เดือน (ลูกแมว)') age_months = 4;
        else if (ageRange === 'มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)') age_months = 9;
        else if (ageRange === 'มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)') age_months = 36;
        else if (ageRange === 'มากกว่า 7 ปี (แมวสูงวัย)') age_months = 96;

        let req_space_level = 'medium';
        if (reqHousing === 'พื้นที่โล่งกว้างๆ') req_space_level = 'large';
        else if (reqHousing === 'ไม่ต้องการพื้นที่มาก') req_space_level = 'small';

        let req_attention = 'medium';
        if (reqTime === 'น้อย' || reqTime === 'low') req_attention = 'low';
        else if (reqTime === 'มาก' || reqTime === 'high') req_attention = 'high';

        let req_budget_level = 'medium';
        if (reqBudget === 'น้อย' || reqBudget === 'low') req_budget_level = 'low';
        else if (reqBudget === 'มาก' || reqBudget === 'high') req_budget_level = 'high';

        const personality_mapped = reqOtherPets ? `เข้ากับสัตว์อื่น: ${reqOtherPets}` : null;
        
        const good_with_children_mapped = (goodWithChildren === true || goodWithChildren === 'true' || goodWithChildren === 1) ? 1 : 0;
        const good_with_cats_mapped = (goodWithCats === true || goodWithCats === 'true' || goodWithCats === 1) ? 1 : 0;
        const good_with_dogs_mapped = (goodWithDogs === true || goodWithDogs === 'true' || goodWithDogs === 1) ? 1 : 0;
        const has_special_needs_mapped = (hasSpecialNeeds === true || hasSpecialNeeds === 'true' || hasSpecialNeeds === 1) ? 1 : 0;

        let req_experience_level = 'none';
        if (reqExperience === 'beginner' || reqExperience === 'พอมีประสบการณ์') req_experience_level = 'beginner';
        else if (reqExperience === 'experienced' || reqExperience === 'มีประสบการณ์สูง') req_experience_level = 'experienced';

        const [result] = await pool.query(`
            INSERT INTO cats 
            (poster_id, pet_name, pet_breed, gender, age_months, is_sterilized, is_vaccinated, health_note, req_space_level, req_attention, personality, req_budget_level, req_experience_level, good_with_children, good_with_cats, good_with_dogs, has_special_needs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            name || null,
            breed || 'ไม่ทราบสายพันธุ์',
            pet_gender,
            age_months,
            sterilization || null,
            vaccination || null,
            healthDetails || null,
            req_space_level,
            req_attention,
            personality_mapped,
            req_budget_level,
            req_experience_level,
            good_with_children_mapped,
            good_with_cats_mapped,
            good_with_dogs_mapped,
            has_special_needs_mapped
        ]);

        // ไม่มีการอัปเดต role เป็น poster แล้ว เนื่องจากฐานข้อมูลใช้เพียง 'user' และ 'admin'

        return res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลแมวสำเร็จ',
            catId: result.insertId
        });

    } catch (error) {
        console.error('createCat error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถบันทึกข้อมูลแมวได้'
        });
    }
}

async function getCatsByPosterId(req, res) {
    try {
        const posterId = req.params.id;
        const [rows] = await pool.query(`
            SELECT
                c.cat_id,
                c.pet_name,
                c.pet_breed,
                c.gender,
                c.age_months,
                c.personality,
                c.health_note,
                c.req_space_level,
                c.req_attention,
                c.status,
                c.req_budget_level,
                c.good_with_children,
                c.good_with_cats,
                c.good_with_dogs,
                c.has_special_needs,
                c.req_experience_level,
                c.is_sterilized,
                c.is_vaccinated,
                c.created_at,
                c.poster_id,
                (
                    SELECT cp.image_url
                    FROM catphotos AS cp
                    WHERE cp.cat_id = c.cat_id
                    ORDER BY cp.photo_id ASC
                    LIMIT 1
                ) AS image_url
            FROM cats AS c
            WHERE c.poster_id = ?
            ORDER BY c.created_at DESC
        `, [posterId]);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error('getCatsByPosterId error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลประวัติการโพสต์ได้'
        });
    }
}

async function uploadCatPhoto(req, res) {
    try {
        const catId = req.params.catId;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาอัปโหลดรูปภาพ'
            });
        }
        // Iterate over files and insert each photo
        for (const file of files) {
            await pool.query(`
                INSERT INTO catphotos (cat_id, image_url) VALUES (?,?)`,
                [catId, file.path]
            );
        }

        return res.status(201).json({
            success: true,
            message: 'อัปโหลดรูปภาพสำเร็จ',
            catId: catId
        });
    } catch (error) {
        console.error('uploadCatPhoto error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถอัปโหลดรูปภาพได้'
        });
    }
}

async function deleteCatPhoto(req, res) {
    try {
        const { catId, photoId } = req.params;
        const [result] = await pool.query(`
            DELETE FROM catphotos WHERE cat_id = ? AND photo_id = ?`,
            [catId, photoId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบรูปภาพที่ต้องการลบ'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'ลบรูปภาพสำเร็จ'
        });
    } catch (error) {
        console.error('deleteCatPhoto error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถลบรูปภาพได้'
        });
    }
}

async function updateCatPhoto(req, res) {
    try {
        const { catId, photoId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาอัปโหลดรูปภาพใหม่'
            });
        }

        const [rows] = await pool.query(`
            SELECT image_url FROM catphotos 
            WHERE cat_id = ? AND photo_id = ?
        `, [catId, photoId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบรูปภาพที่ต้องการแก้ไข'
            });
        }

        const [result] = await pool.query(`
            UPDATE catphotos 
            SET image_url = ? 
            WHERE cat_id = ? AND photo_id = ?
        `, [file.path, catId, photoId]);

        return res.status(200).json({
            success: true,
            message: 'อัปเดตรูปภาพสำเร็จ',
            photoId: photoId,
            newImageUrl: file.path
        });

    } catch (error) {
        console.error('updateCatPhoto error:', error);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถอัปเดตรูปภาพได้'
        });
    }
}

async function updateCat(req, res) {
    try {
        const catId = req.params.id;
        const {
            // ฟิลด์หลักจากฝั่ง api
            pet_name, pet_breed, gender, age_months,
            is_sterilized, is_vaccinated, health_note,
            req_space_level, req_attention, req_budget_level, personality, status,

            // ฟิลด์จากฝั่ง main เผื่อกรณี Frontend ส่งมาแบบเก่า
            name, breed, ageRange, sterilization, vaccination,
            healthDetails, reqHousing, reqTime, reqOtherPets, reqBudget, reqExperience,
            goodWithChildren, goodWithCats, goodWithDogs, hasSpecialNeeds
        } = req.body;

        // --- ผสมข้อมูลและแปลงค่า (Mapping) เพื่อให้ใช้งานได้กับทั้งสองฝั่ง ---
        const final_pet_name = pet_name || name || null;
        const final_pet_breed = pet_breed || breed || null;
        
        // แปลงเพศถ้าส่งมาเป็นภาษาไทย
        let final_gender = gender || null;
        if (final_gender === 'ผู้') final_gender = 'male';
        else if (final_gender === 'เมีย') final_gender = 'female';

        // แปลงอายุ (Default 12)
        let final_age_months = age_months || 12; 
        if (ageRange) {
            if (ageRange === 'ต่ำกว่า 2 เดือน (ยังไม่หย่านม)') final_age_months = 1;
            else if (ageRange === '2 - 6 เดือน (ลูกแมว)') final_age_months = 4;
            else if (ageRange === 'มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)') final_age_months = 9;
            else if (ageRange === 'มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)') final_age_months = 36;
            else if (ageRange === 'มากกว่า 7 ปี (แมวสูงวัย)') final_age_months = 96;
        }

        const final_is_sterilized = is_sterilized || sterilization || null;
        const final_is_vaccinated = is_vaccinated || vaccination || null;
        const final_health_note = health_note || healthDetails || null;

        // แปลงความต้องการพื้นที่
        let final_req_space_level = req_space_level || 'medium';
        if (reqHousing === 'พื้นที่โล่งกว้างๆ') final_req_space_level = 'large';
        else if (reqHousing === 'ไม่ต้องการพื้นที่มาก') final_req_space_level = 'small';

        // แปลงความต้องการเวลา
        let final_req_attention = req_attention || 'medium';
        if (reqTime === 'น้อย' || reqTime === 'low') final_req_attention = 'low';
        else if (reqTime === 'มาก' || reqTime === 'high') final_req_attention = 'high';

        // แปลงความต้องการงบประมาณ
        let final_req_budget = req_budget_level || 'medium';
        if (reqBudget === 'น้อย' || reqBudget === 'low') final_req_budget = 'low';
        else if (reqBudget === 'มาก' || reqBudget === 'high') final_req_budget = 'high';

        // จัดการนิสัย
        let final_personality = personality || null;
        if (!final_personality && reqOtherPets) {
            final_personality = `เข้ากับสัตว์อื่น: ${reqOtherPets}`;
        }

        // จัดการ Boolean fields ใหม่
        let final_good_with_children = req.body.good_with_children !== undefined ? req.body.good_with_children : (goodWithChildren !== undefined ? goodWithChildren : null);
        if (final_good_with_children !== null) final_good_with_children = (final_good_with_children === true || final_good_with_children === 'true' || final_good_with_children === 1) ? 1 : 0;
        
        let final_good_with_cats = req.body.good_with_cats !== undefined ? req.body.good_with_cats : (goodWithCats !== undefined ? goodWithCats : null);
        if (final_good_with_cats !== null) final_good_with_cats = (final_good_with_cats === true || final_good_with_cats === 'true' || final_good_with_cats === 1) ? 1 : 0;

        let final_good_with_dogs = req.body.good_with_dogs !== undefined ? req.body.good_with_dogs : (goodWithDogs !== undefined ? goodWithDogs : null);
        if (final_good_with_dogs !== null) final_good_with_dogs = (final_good_with_dogs === true || final_good_with_dogs === 'true' || final_good_with_dogs === 1) ? 1 : 0;

        let final_has_special_needs = req.body.has_special_needs !== undefined ? req.body.has_special_needs : (hasSpecialNeeds !== undefined ? hasSpecialNeeds : null);
        if (final_has_special_needs !== null) final_has_special_needs = (final_has_special_needs === true || final_has_special_needs === 'true' || final_has_special_needs === 1) ? 1 : 0;

        let final_req_experience_level = req.body.req_experience_level !== undefined ? req.body.req_experience_level : 'none';
        if (reqExperience) {
            if (reqExperience === 'beginner' || reqExperience === 'พอมีประสบการณ์') final_req_experience_level = 'beginner';
            else if (reqExperience === 'experienced' || reqExperience === 'มีประสบการณ์สูง') final_req_experience_level = 'experienced';
            else final_req_experience_level = 'none';
        }

        const final_status = status || null;

        const [result] = await pool.query(`
            UPDATE cats 
            SET pet_name = ?, pet_breed = ?, gender = ?, age_months = ?, is_sterilized = ?, is_vaccinated = ?, health_note = ?, req_space_level = ?, req_attention = ?, req_budget_level = ?, req_experience_level = ?, personality = ?, status = COALESCE(?, status),
                good_with_children = COALESCE(?, good_with_children), good_with_cats = COALESCE(?, good_with_cats), good_with_dogs = COALESCE(?, good_with_dogs), has_special_needs = COALESCE(?, has_special_needs)
            WHERE cat_id = ?
        `, [
            final_pet_name, 
            final_pet_breed, 
            final_gender, 
            final_age_months, 
            final_is_sterilized, 
            final_is_vaccinated, 
            final_health_note, 
            final_req_space_level, 
            final_req_attention,
            final_req_budget, 
            final_req_experience_level,
            final_personality, 
            final_status, 
            final_good_with_children,
            final_good_with_cats,
            final_good_with_dogs,
            final_has_special_needs,
            catId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแมว' });
        }

        return res.status(200).json({
            success: true,
            message: 'อัปเดตข้อมูลแมวสำเร็จ'
        });

    } catch (error) {
        console.error('updateCat error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลแมวได้' });
    }
}

async function deleteCat(req, res) {
    try {
        const catId = req.params.id;

        const [result] = await pool.query(`
            DELETE FROM cats WHERE cat_id = ?
        `, [catId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแมวที่ต้องการลบ' });
        }

        return res.status(200).json({
            success: true,
            message: 'ลบโพสต์แมวสำเร็จ'
        });

    } catch (error) {
        console.error('deleteCat error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถลบข้อมูลแมวได้' });
    }
}

module.exports = {
    getAllCats,
    getCatById,
    createCat,
    getCatsByPosterId,
    uploadCatPhoto,
    deleteCatPhoto,
    updateCatPhoto,
    updateCat,
    deleteCat
};
