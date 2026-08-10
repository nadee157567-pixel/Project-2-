require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');

async function run() {
    try {
        await pool.query(`
        INSERT INTO evaluation_criteria
        (criteria_code, criteria_name, admin_id, profile_field, condition_value, criteria_type, comparison_type, score_ratio, max_score, is_blocking, is_active)
        VALUES
        ('SPACE', 'พื้นที่ในการเลี้ยง', 1, 'space_level', 'equal_or_higher', 'score', 'level', 1.00, 25, 0, 1),
        ('SPACE', 'พื้นที่ในการเลี้ยง', 1, 'space_level', 'lower_one_level', 'score', 'level', 0.50, 25, 0, 1),
        ('SPACE', 'พื้นที่ในการเลี้ยง', 1, 'space_level', 'lower_two_levels', 'score', 'level', 0.00, 25, 1, 1),
        
        ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'equal_or_higher', 'score', 'level', 1.00, 25, 0, 1),
        ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'lower_one_level', 'score', 'level', 0.50, 25, 0, 1),
        ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'lower_two_levels', 'score', 'level', 0.00, 25, 1, 1),
        
        ('ATTENTION', 'เวลาในการดูแล', 1, 'attention_level', 'equal_or_higher', 'score', 'level', 1.00, 25, 0, 1),
        ('ATTENTION', 'เวลาในการดูแล', 1, 'attention_level', 'lower_one_level', 'score', 'level', 0.50, 25, 0, 1),
        ('ATTENTION', 'เวลาในการดูแล', 1, 'attention_level', 'lower_two_levels', 'score', 'level', 0.00, 25, 1, 1),
        
        ('EXPERIENCE', 'ประสบการณ์ในการเลี้ยง', 1, 'experience_level', 'equal_or_higher', 'score', 'level', 1.00, 25, 0, 1),
        ('EXPERIENCE', 'ประสบการณ์ในการเลี้ยง', 1, 'experience_level', 'lower_one_level', 'score', 'level', 0.50, 25, 0, 1),
        ('EXPERIENCE', 'ประสบการณ์ในการเลี้ยง', 1, 'experience_level', 'lower_two_levels', 'score', 'level', 0.00, 25, 1, 1)
        `);
        console.log('evaluation_criteria repopulated successfully');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
