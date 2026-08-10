const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/:userId/:catId', async (req, res) => {
  const { userId, catId } = req.params;

  try {
    // ดึงข้อมูลโปรไฟล์ผู้ขอรับเลี้ยง
    const [profileData] = await pool.query(
      'SELECT living_space_type, max_monthly_budget, daily_free_hours, experience FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    // ดึงข้อมูลความต้องการของแมวและเจ้าของแมว
    const [catData] = await pool.query(
      'SELECT req_space_level, req_attention, est_monthly_cost, poster_id FROM cats WHERE cat_id = ?',
      [catId]
    );

    if (profileData.length === 0 || catData.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้หรือน้องแมว" });
    }

    const user = profileData[0];
    const cat = catData[0];

    // ไม่อนุญาตให้เจ้าของแมวทำแบบประเมินแมวของตัวเอง
    if (Number(userId) === Number(cat.poster_id)) {
      return res.status(400).json({ success: false, message: "เจ้าของแมวไม่สามารถทำแบบประเมินแมวของตนเองได้" });
    }

    // --- เริ่มการคำนวณคะแนน (เต็ม 5 ดาวต่อด้าน) ---

    // 1. ด้านงบประมาณ (เทียบ max_monthly_budget กับ est_monthly_cost)
    let budgetScore = 5;
    const catCost = cat.est_monthly_cost || 3000;
    if (user.max_monthly_budget < catCost) {
      budgetScore = Math.max(1, Math.round((user.max_monthly_budget / catCost) * 5));
    }

    // 2. ด้านเวลา (เทียบ daily_free_hours กับ req_attention: small, medium, large)
    let timeScore = 5;
    if (cat.req_attention === 'large' && user.daily_free_hours < 4) timeScore = 2;
    else if (cat.req_attention === 'medium' && user.daily_free_hours < 2) timeScore = 3;

    // 3. ด้านพื้นที่ (เทียบ living_space_type กับ req_space_level: small, medium, large)
    let spaceScore = 5;
    if (cat.req_space_level === 'large' && (user.living_space_type === 'condo' || user.living_space_type === 'apartment')) {
      spaceScore = 2;
    } else if (cat.req_space_level === 'medium' && user.living_space_type === 'apartment') {
      spaceScore = 3;
    }

    // 4. ด้านประสบการณ์ (ประสบการณ์ none, beginner, experienced)
    let expScore = user.experience === 'experienced' ? 5 : (user.experience === 'beginner' ? 3 : 1);

    // คำนวณเปอร์เซ็นต์รวม (เต็ม 20 คะแนน จาก 4 ด้าน)
    const totalScorePercent = Math.round(((budgetScore + timeScore + spaceScore + expScore) / 20) * 100);

    res.json({
      success: true,
      data: {
        matchPercent: totalScorePercent,
        scores: {
          space: spaceScore,
          time: timeScore,
          budget: budgetScore,
          experience: expScore
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
