require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');
const { matchSelectedCat } = require('./controllers/matchingController');

async function test() {
    try {
        const req = { params: { catId: '1' }, body: { userId: 1 } };
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
