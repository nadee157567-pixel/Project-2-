async function handleLogin(username, password) {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // เช็คว่าเป็น Admin จริงหรือไม่ก่อนให้เข้าหน้า Dashboard
            if (data.role === 'admin') {
                // เก็บ Token ไว้ใน Local Storage ของเบราว์เซอร์
                localStorage.setItem('adminToken', data.token);
                alert('เข้าสู่ระบบแอดมินสำเร็จ');
                // เปลี่ยนหน้าไปที่ Dashboard
                window.location.href = '/dashboard.html';
            } else {
                alert('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบหลังบ้าน');
            }
        } else {
            alert('ล็อกอินไม่สำเร็จ: ' + data.message);
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
}