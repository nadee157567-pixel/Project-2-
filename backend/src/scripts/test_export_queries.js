const pool = require('../config/database');

async function testQueries() {
  try {
    const [users] = await pool.query('SELECT u.user_id, u.username, u.fullname, u.email, u.phonenumber, u.role, u.is_banned, u.created_at FROM users u LIMIT 2');
    console.log('Users sample:', users);

    const [apps] = await pool.query(`
      SELECT a.match_id, a.cat_id, c.pet_name, c.pet_breed, a.applicant_id, u.fullname, a.matchscore, a.status, a.applied_at 
      FROM adoptionapplications a 
      LEFT JOIN cats c ON a.cat_id = c.cat_id 
      LEFT JOIN users u ON a.applicant_id = u.user_id 
      LIMIT 2
    `);
    console.log('Apps sample:', apps);

    const [trends] = await pool.query(`
      SELECT 
        DATE_FORMAT(applied_at, '%Y-%m') as month_key, 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count
      FROM adoptionapplications 
      GROUP BY month_key
    `);
    console.log('Trends sample:', trends);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testQueries();
