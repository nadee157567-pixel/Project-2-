const pool = require('../config/database');
// get / api / cats - ดึงรายการของแมว

async function getAllCats(req, res){
    try{
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
                c.est_monthly_cost,
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
              
            ORDER BY c.created_at DESC`);
        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    }catch (error) {
        console.error('getAllCats error:',error);

        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลของแมวได้'
        });
    }
}

// get / api / cats /:id - ดึงรายละเอียดของแมว 1 ตัว
async function getCatById(req, res){
    try{
        const catId = Number(req.params.id);
        if (!Number.isInteger(catId) || catId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'รหัสของแมวไม่ถูกต้อง'
            });
        }
        const [cats] =  await pool.query(`
            SELECT
                c.*,
                u.fullname AS poster_name,
                u.phonenumber AS poster_phone,
                u.line_id As poster_line_id
            FROM cats AS c
            JOIN users AS u
              ON c.poster_id = u.user_id
            WHERE c.cat_id = ?`,[catId]);

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
    }catch (error) {
        console.error('getCatById error:',error);

        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงรายละเอียดของแมวได้'
        });
    }
}

module.exports = {
    getAllCats,
    getCatById
}

