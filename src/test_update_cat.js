require('dotenv').config({ path: '../.env' });
const pool = require('./config/database');
const { updateCat } = require('./controllers/catController');

async function test() {
    try {
        const req = {
            params: { id: '8' },
            body: {
                name: "Test Cat Edited",
                breed: "Thai",
                gender: "ผู้",
                ageRange: "1-6 เดือน",
                sterilization: 0,
                vaccination: 1,
                healthDetails: "Good",
                reqHousing: "คอนโด",
                reqTime: "ปานกลาง",
                reqOtherPets: "ไม่มี",
                reqBudget: "ปานกลาง",
                goodWithChildren: true,
                goodWithCats: false,
                goodWithDogs: false,
                hasSpecialNeeds: false
            }
        };
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { console.log("Status:", this.statusCode); console.log(JSON.stringify(data, null, 2)); }
        };
        await updateCat(req, res);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
