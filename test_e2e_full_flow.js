require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = 9999;
const BASE_URL = `http://localhost:${PORT}`;

let server;

async function runTest() {
    console.log('Starting server for E2E tests...');
    server = http.createServer(app);
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Server running on ${BASE_URL}\n`);

    try {
        await executeFlow();
    } catch (e) {
        console.error('Test execution failed:', e.message);
    } finally {
        process.exit(0);
    }
}

async function request(method, path, body = null) {
    const options = {
        method,
        headers: {}
    };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE_URL}${path}`, options);
    let data;
    try {
        data = await res.json();
    } catch(e) {
        data = await res.text();
    }
    
    if (!res.ok) {
        throw new Error(`[${method}] ${path} returned ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function executeFlow() {
    let adopterId, posterId;
    
    const adopterName = 'testadopter' + Date.now();
    const posterName = 'testposter' + Date.now();

    // 1. Register Adopter
    console.log('1. Registering Adopter...');
    const adopterReg = await request('POST', '/api/auth/signup', {
        username: adopterName,
        password: 'password123',
        email: adopterName + '@example.com',
        firstName: 'Test',
        lastName: 'Adopter',
        phoneNumber: '0812345678',
        lineId: 'testadopterline',
        address: 'Bangkok'
    });
    console.log('Adopter registered.');
    
    // 2. Login Adopter
    console.log('2. Logging in Adopter...');
    const adopterLogin = await request('POST', '/api/auth/login', {
        username: adopterName,
        password: 'password123'
    });
    adopterId = adopterLogin.userId;
    console.log(`Adopter ID: ${adopterId}`);

    // 3. Register Poster
    console.log('3. Registering Poster...');
    const posterReg = await request('POST', '/api/auth/signup', {
        username: posterName,
        password: 'password123',
        email: posterName + '@example.com',
        firstName: 'Test',
        lastName: 'Poster',
        phoneNumber: '0898765432',
        lineId: 'testposterline',
        address: 'Chiang Mai'
    });
    console.log('Poster registered.');
    
    // 4. Login Poster
    console.log('4. Logging in Poster...');
    const posterLogin = await request('POST', '/api/auth/login', {
        username: posterName,
        password: 'password123'
    });
    posterId = posterLogin.userId;
    console.log(`Poster ID: ${posterId}`);

    // 5. Adopter creates Profile
    console.log('5. Adopter creating profile...');
    const profileRes = await request('POST', '/api/adopters/', {
        userId: adopterId,
        living_space_type: 'house',
        space_size: 'large',
        max_monthly_budget: 'high',
        daily_free_hours: 'high',
        has_other_pets: false,
        has_children: false,
        experience: 'experienced'
    });
    console.log('Profile created.');

    // 6. Poster creates Cat
    console.log('6. Poster creating cat listing...');
    const catRes = await request('POST', '/api/cats', {
        userId: posterId,
        name: 'Fluffy99',
        breed: 'เปอร์เซีย',
        gender: 'ผู้',
        ageRange: '2 - 6 เดือน (ลูกแมว)',
        sterilization: 'ทำแล้ว',
        vaccination: 'ฉีดครบแล้ว',
        healthDetails: 'Healthy',
        reqHousing: 'พื้นที่โล่งกว้างๆ',
        reqTime: 'มาก',
        reqBudget: 'มาก',
        reqOtherPets: 'เข้ากันได้ดี',
        reqExperience: 'experienced',
        goodWithChildren: true,
        goodWithCats: true,
        goodWithDogs: false,
        hasSpecialNeeds: false
    });
    const catId = catRes.catId;
    console.log(`Cat created with ID: ${catId}`);

    // 7. Get Cats
    console.log('7. Adopter browsing cats...');
    const getCatsRes = await request('GET', '/api/cats');
    const fluffy = getCatsRes.data.find(c => c.pet_name === 'Fluffy99');
    if (!fluffy) throw new Error('Created cat not found in feed');
    console.log('Cat found in feed.');

    // 8. Evaluate Matching
    console.log('8. Adopter evaluating match with Cat...');
    const evalRes = await request('POST', `/api/matching/${catId}`, {
        userId: adopterId
    });
    console.log(`Match percent: ${evalRes.data.matchPercent}%`);

    // 9. Adopter Requests Adoption
    console.log('9. Adopter requesting adoption...');
    const reqRes = await request('POST', '/api/adoption', {
        applicant_id: adopterId,
        cat_id: catId,
        assessment_id: evalRes.data.assessmentId,
        message: 'I want to adopt Fluffy99!'
    });
    const matchId = reqRes.data.match_id;
    console.log(`Request sent with match_id: ${matchId}`);

    // 10. Poster views incoming requests
    console.log('10. Poster viewing pending requests...');
    const posterReqs = await request('GET', `/api/adoption/cat/${catId}`);
    if (posterReqs.data.length === 0) throw new Error('No pending requests found for poster');
    console.log(`Found ${posterReqs.data.length} pending requests.`);

    // 11. Poster approves request
    console.log('11. Poster approving request...');
    const approveRes = await request('PUT', `/api/adoption/request/${matchId}/status`, {
        status: 'approved'
    });
    console.log('Approval successful.');

    console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY! No backend errors found during the user journey.');
}

runTest();
