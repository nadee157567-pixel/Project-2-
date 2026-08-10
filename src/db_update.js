require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');

async function run() {
    try {
        console.log("Starting DB update...");

        // Force set max_monthly_budget to valid enum values before converting to ENUM
        try {
            await pool.query(`UPDATE user_profiles SET max_monthly_budget = 'medium'`);
            await pool.query(`ALTER TABLE user_profiles MODIFY max_monthly_budget ENUM('low', 'medium', 'high') DEFAULT 'medium'`);
            console.log("Updated max_monthly_budget.");
        } catch (e) {
            console.log("Error updating max_monthly_budget: " + e.message);
        }

        // 3. Update evaluation_criteria for BUDGET
        try {
            // Delete old budget rules
            await pool.query(`DELETE FROM evaluation_criteria WHERE criteria_code = 'BUDGET'`);
            
            // Insert new budget rules using level comparison
            await pool.query(`
                INSERT INTO evaluation_criteria (criteria_code, criteria_name, admin_id, profile_field, condition_value, criteria_type, comparison_type, score_ratio, max_score, is_blocking, is_active)
                VALUES 
                ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'equal_or_higher', 'score', 'level', 1.00, 25, 0, 1),
                ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'lower_one_level', 'score', 'level', 0.50, 25, 0, 1),
                ('BUDGET', 'งบประมาณต่อเดือน', 1, 'budget_level', 'lower_two_levels', 'score', 'level', 0.00, 25, 1, 1)
            `);
            console.log("Updated evaluation_criteria for BUDGET.");
        } catch (e) {
            console.log("Error updating evaluation_criteria: " + e.message);
        }

        console.log("DB update completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Overall error:", error);
        process.exit(1);
    }
}

run();
