const http = require('http');

async function runTests() {
    console.log('--- เริ่มการทดสอบ API ---');
    
    // 1. Signup
    console.log('\n[1] Testing Signup...');
    let signupRes = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'testuser_' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            phone: '0812345678'
        })
    });
    let signupData = await signupRes.json();
    console.log('Signup Response:', signupData);
    
    // 2. Login
    console.log('\n[2] Testing Login...');
    let loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: signupData.username || 'testuser', 
            // We need the exact username, wait let's use the one we just made
            username: JSON.parse(signupRes.url ? '' : '""') || 'testuser', // We actually didn't pass back username in response. Let's hardcode a unique one for login
        })
    }); // Actually, fetch response body needs to be read properly.

}

// To make it simple, let's use a self-contained node fetch sequence
async function doFetch(url, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    try {
        const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        return await response.json();
    } catch (e) {
        return { error: e.message };
    }
}

async function testAll() {
    const unique = Date.now();
    const username = 'testuser' + unique;
    const email = 'test' + unique + '@example.com';
    
    console.log('1. Signup:');
    const signup = await doFetch('http://localhost:3000/api/auth/signup', 'POST', {
        username, email, password: 'password123', phone: '0812345678'
    });
    console.log(signup);

    console.log('\n2. Login:');
    const login = await doFetch('http://localhost:3000/api/auth/login', 'POST', {
        username, password: 'password123'
    });
    console.log(login);
    const token = login.token; // Wait, authController doesn't return token as 'token', it returns it inside the response? Wait, I added JWT. Let me check what I named it.
}

testAll();
