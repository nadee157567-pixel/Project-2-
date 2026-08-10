const pool = require('../config/database');

// get / api / cats - ดึงรายการของแมว
async function getAllCats(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT
                c.*,
                
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
            reqOtherPets
        } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ userId' });
        }

        // Mapping values
        const pet_gender = gender === 'ผู้' ? 'male' : 'female';

        let age_months = 12; // default
        if (ageRange === 'ต่ำกว่า 2 เดือน (ยังไม่หย่านม)') age_months = 1;
        else if (ageRange === '2 - 6 เดือน (ลูกแมว)') age_months = 4;
        else if (ageRange === '6 เดือน - 1 ปี (แมววัยรุ่น)') age_months = 9;
        else if (ageRange === '1 - 7 ปี (แมวโตเต็มวัย)') age_months = 36;
        else if (ageRange === '7 ปีขึ้นไป (แมวสูงวัย)') age_months = 96;

        let req_space_level = 'medium';
        if (reqHousing && reqHousing.startsWith('พื้นที่โล่งกว้างๆ')) req_space_level = 'large';
        else if (reqHousing && reqHousing.startsWith('ไม่ต้องการพื้นที่มาก')) req_space_level = 'small';

        let req_attention = 'medium';
        if (reqTime && reqTime.startsWith('น้อย')) req_attention = 'low';
        else if (reqTime && reqTime.startsWith('มาก')) req_attention = 'high';

        const personality_mapped = reqOtherPets ? `เข้ากับสัตว์อื่น: ${reqOtherPets}` : null;

        const [result] = await pool.query(`
            INSERT INTO cats 
            (poster_id, pet_name, pet_breed, gender, age_months, is_sterilized, is_vaccinated, health_note, req_space_level, req_attention, personality, est_monthly_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            3000 // default est_monthly_cost
        ]);

        return res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลแมวสำเร็จ',
            catId: result.insertId
        });

    } catch (error) {
        console.error('createCat error:', error);
        require('fs').writeFileSync('last_error.txt', error.toString() + '\\n' + error.stack);
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
                c.*,
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
        for (const file of files) {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const fullUrl = `http://10.0.2.2:3000/${normalizedPath}`;
            await pool.query(
                `INSERT INTO catphotos (cat_id, image_url) VALUES (?,?)`,
                [catId, fullUrl]
            );
        }

        return res.status(201).json({
            success: true,
            message: 'อัปโหลดรูปภาพสำเร็จ',
            catId: catId
        });
    } catch (error) {
        console.error('uploadCatPhoto error:', error);
        require('fs').writeFileSync('last_upload_error.txt', error.toString() + '\\n' + error.stack);
        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถอัปโหลดรูปภาพได้'
        });
    }
}

async function deleteCatPhoto(params) {
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

        const normalizedPath = file.path.replace(/\\/g, '/');
        const fullUrl = `http://10.0.2.2:3000/${normalizedPath}`;

        const [result] = await pool.query(`
            UPDATE catphotos 
            SET image_url = ? 
            WHERE cat_id = ? AND photo_id = ?
        `, [fullUrl, catId, photoId]);

        return res.status(200).json({
            success: true,
            message: 'อัปเดตรูปภาพสำเร็จ',
            photoId: photoId,
            newImageUrl: fullUrl
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
            status
        } = req.body;

        const pet_gender = gender === 'ผู้' ? 'male' : (gender === 'เมีย' ? 'female' : gender);

        let age_months = 12; // default
        if (ageRange) {
            if (ageRange.includes('ยังไม่หย่านม')) age_months = 1;
            else if (ageRange.includes('ลูกแมว')) age_months = 4;
            else if (ageRange.includes('วัยรุ่น')) age_months = 9;
            else if (ageRange.includes('โตเต็มวัย')) age_months = 36;
            else if (ageRange.includes('สูงวัย')) age_months = 96;
        }

        let req_space_level = null;
        if (reqHousing) {
            if (reqHousing.startsWith('พื้นที่โล่งกว้างๆ')) req_space_level = 'large';
            else if (reqHousing.startsWith('ไม่ต้องการพื้นที่มาก')) req_space_level = 'small';
            else req_space_level = 'medium';
        }

        let req_attention = null;
        if (reqTime) {
            if (reqTime.startsWith('น้อย')) req_attention = 'low';
            else if (reqTime.startsWith('มาก')) req_attention = 'high';
            else req_attention = 'medium';
        }

        const personality_mapped = reqOtherPets ? `เข้ากับสัตว์อื่น: ${reqOtherPets}` : null;

        const [result] = await pool.query(`
            UPDATE cats 
            SET pet_name = ?, pet_breed = ?, gender = ?, age_months = ?, is_sterilized = ?, is_vaccinated = ?, health_note = ?, req_space_level = ?, req_attention = ?, personality = ?, status = COALESCE(?, status)
            WHERE cat_id = ?
        `, [
            name || null,
            breed || null,
            pet_gender || null,
            age_months,
            sterilization || null,
            vaccination || null,
            healthDetails || null,
            req_space_level,
            req_attention,
            personality_mapped,
            status || null,
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
