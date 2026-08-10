require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');
const { matchSelectedCat } = require('./controllers/matchingController');

async function test() {
    try {
        const [profiles] = await pool.query('SELECT user_id FROM user_profiles LIMIT 1');
        if (profiles.length === 0) { console.log('No profiles found'); process.exit(0); }
        const userId = profiles[0].user_id;

        const req = { params: { catId: '1' }, body: { userId: userId } };
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { console.log("Status:", this.statusCode); console.log(JSON.stringify(data, null, 2)); }
        };
        await matchSelectedCat(req, res);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
