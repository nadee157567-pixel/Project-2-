async function fetchDashboardStats() {
    // ดึง Token ที่เก็บไว้ออกมา
    const token = localStorage.getItem('adminToken');

    // ถ้าไม่มี Token แปลว่ายังไม่ได้ล็อกอิน ให้เตะกลับไปหน้า Login
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/admin/dashboard', {
            method: 'GET',
            headers: {
                // แนบ Token ไปกับ Header แบบ Bearer
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        // จัดการกรณี Token หมดอายุ (401) หรือไม่ใช่แอดมิน (403)
        if (response.status === 401 || response.status === 403) {
            alert('เซสชันหมดอายุ หรือคุณไม่มีสิทธิ์ กรุณาล็อกอินใหม่');
            localStorage.removeItem('adminToken'); // ลบ Token ทิ้ง
            window.location.href = '/login.html';
            return;
        }

        if (data.success) {
            // นำข้อมูลสถิติไปอัปเดตลงบนหน้าเว็บ HTML
            console.log('สถิติรวม:', data.data);
            document.getElementById('total-users').innerText = data.data.total_users;
            document.getElementById('total-cats').innerText = data.data.total_cats;
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// เรียกใช้ฟังก์ชันทันทีที่โหลดหน้าเว็บเสร็จ
fetchDashboardStats();