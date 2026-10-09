const pool = require('../config/database');
const ExcelJS = require('exceljs');

async function getDashboardStats(req, res) {
    try {
        const thaiMonthsList = [
            { key: '01', name: 'มกราคม', short: 'ม.ค.' },
            { key: '02', name: 'กุมภาพันธ์', short: 'ก.พ.' },
            { key: '03', name: 'มีนาคม', short: 'มี.ค.' },
            { key: '04', name: 'เมษายน', short: 'เม.ย.' },
            { key: '05', name: 'พฤษภาคม', short: 'พ.ค.' },
            { key: '06', name: 'มิถุนายน', short: 'มิ.ย.' },
            { key: '07', name: 'กรกฎาคม', short: 'ก.ค.' },
            { key: '08', name: 'สิงหาคม', short: 'ส.ค.' },
            { key: '09', name: 'กันยายน', short: 'ก.ย.' },
            { key: '10', name: 'ตุลาคม', short: 'ต.ค.' },
            { key: '11', name: 'พฤศจิกายน', short: 'พ.ย.' },
            { key: '12', name: 'ธันวาคม', short: 'ธ.ค.' }
        ];

        const [
            [[usersResult]],
            [[postersResult]],
            [[adoptersResult]],
            [[catsResult]],
            [[availableCatsResult]],
            [[adoptedCatsResult]],
            [[applicationsResult]],
            [[pendingApplicationsResult]],
            [[assessmentsResult]],
            [catsList],
            [appsList]
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'user'`),
            pool.query(`SELECT COUNT(DISTINCT poster_id) AS count FROM cats`),
            pool.query(`SELECT COUNT(DISTINCT applicant_id) AS count FROM adoptionapplications`),
            pool.query(`SELECT COUNT(*) AS count FROM cats WHERE is_hidden = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM cats WHERE status != 'adopted' AND is_hidden = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM cats WHERE status = 'adopted' AND is_hidden = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications WHERE status = 'pending'`),
            pool.query(`SELECT COUNT(*) AS count FROM assessments`),
            pool.query(`
                SELECT 
                    cat_id,
                    COALESCE(NULLIF(TRIM(pet_breed), ''), 'ไม่ทราบสายพันธุ์') AS pet_breed,
                    status,
                    poster_id,
                    created_at,
                    DATE_FORMAT(created_at, '%m') AS created_month,
                    DATE_FORMAT(created_at, '%Y-%m') AS created_month_key
                FROM cats
                WHERE is_hidden = 0
            `),
            pool.query(`
                SELECT 
                    a.match_id,
                    a.cat_id,
                    COALESCE(NULLIF(TRIM(c.pet_breed), ''), 'ไม่ทราบสายพันธุ์') AS pet_breed,
                    a.applicant_id,
                    a.status,
                    a.applied_at,
                    DATE_FORMAT(a.applied_at, '%m') AS applied_month,
                    DATE_FORMAT(a.applied_at, '%Y-%m') AS applied_month_key
                FROM adoptionapplications a
                LEFT JOIN cats c ON a.cat_id = c.cat_id
            `)
        ]);

        const monthlyTrends = thaiMonthsList.map(m => {
            const added = catsList.filter(c => c.created_month === m.key).length;
            const adopted = appsList.filter(a => a.applied_month === m.key && a.status === 'approved').length;
            const pending = appsList.filter(a => a.applied_month === m.key && a.status === 'pending').length;
            return {
                name: m.name,
                short: m.short,
                month_num: m.key,
                added,
                adopted,
                pending
            };
        });

        const userTypes = [
            { name: 'ผู้ลงประกาศ', value: postersResult ? postersResult.count : 0 },
            { name: 'ผู้ขอรับเลี้ยง', value: adoptersResult ? adoptersResult.count : 0 }
        ];

        const breedCountMap = {};
        catsList.forEach(c => {
            const b = c.pet_breed || 'ไม่ทราบสายพันธุ์';
            if (!breedCountMap[b]) {
                breedCountMap[b] = { name: b, value: 0, adopted: 0, available: 0 };
            }
            breedCountMap[b].value += 1;
            if (c.status === 'adopted') breedCountMap[b].adopted += 1;
            else breedCountMap[b].available += 1;
        });
        const catBreedsAll = Object.values(breedCountMap).sort((a, b) => b.value - a.value);

        const adopterBreedMap = {};
        appsList.forEach(a => {
            const b = a.pet_breed || 'ไม่ทราบสายพันธุ์';
            if (!adopterBreedMap[b]) {
                adopterBreedMap[b] = { name: b, value: 0 };
            }
            adopterBreedMap[b].value += 1;
        });
        const catBreedsAdopters = Object.values(adopterBreedMap).sort((a, b) => b.value - a.value);

        const stats = {
            totalUsers: usersResult ? usersResult.count : 0,
            totalPosters: postersResult ? postersResult.count : 0,
            totalAdopters: adoptersResult ? adoptersResult.count : 0,
            totalCats: catsResult ? catsResult.count : 0,
            adoptedCats: adoptedCatsResult ? adoptedCatsResult.count : 0,
            findingHomeCats: availableCatsResult ? availableCatsResult.count : 0,
            totalApplications: applicationsResult ? applicationsResult.count : 0,
            pendingApplications: pendingApplicationsResult ? pendingApplicationsResult.count : 0,
            totalAssessments: assessmentsResult ? assessmentsResult.count : 0,
            monthlyTrends,
            userTypes,
            catBreeds: {
                all: catBreedsAll,
                posters: catBreedsAll,
                adopters: catBreedsAdopters
            },
            rawCats: catsList,
            rawApps: appsList
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลสถิติได้' });
    }
}

// ดึงกิจกรรมล่าสุด 5-10 รายการ
async function getLatestActivity(req, res) {
    try {
        const [activity] = await pool.query(`
            SELECT 
                a.assessment_id,
                a.applicant_id,
                u.fullname,
                u.username,
                c.pet_name,
                a.status,
                a.assessed_at
            FROM assessments a
            JOIN users u ON a.applicant_id = u.user_id
            JOIN cats c ON a.cat_id = c.cat_id
            ORDER BY a.assessed_at DESC
            LIMIT 10`);

        const formattedActivity = activity.map(act => ({
            activity_id: act.assessment_id,
            description: `คุณ ${act.fullname || act.username || 'ผู้ใช้'} ได้ส่งแบบประเมินสำหรับคำขอเลี้ยงแมว '${act.pet_name || 'ไม่ระบุชื่อ'}'`,
            timestamp: act.assessed_at,
            status: act.status
        }));

        return res.status(200).json({ success: true, data: formattedActivity });
    } catch (error) {
        console.error('getLatestActivity error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลกิจกรรมล่าสุดได้' });
    }
}

// สถิติแนวโน้มการหาบ้านสำเร็จในแต่ละเดือน สำหรับกราฟ
async function getMonthlyAdoptionTrends(req, res) {
    try {
        const [monthlyTrends] = await pool.query(`
            SELECT 
                DATE_FORMAT(applied_at, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM adoptionapplications
            WHERE status = 'approved'
            GROUP BY month
            ORDER BY month ASC`);

        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const monthsResult = [];
        const adoptionsResult = [];

        monthlyTrends.forEach(row => {
            if (row.month) {
                const monthNum = parseInt(row.month.split('-')[1], 10);
                if (monthNum >= 1 && monthNum <= 12) {
                    monthsResult.push(thaiMonths[monthNum - 1]);
                    adoptionsResult.push(row.count);
                }
            }
        });

        // ถ้ายังไม่มีข้อมูล หรือมีน้อย ให้ default เดือนปัจจุบัน
        return res.status(200).json({ 
            success: true, 
            data: { 
                months: monthsResult.length > 0 ? monthsResult : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'], 
                adoptionCounts: adoptionsResult.length > 0 ? adoptionsResult : [0, 0, 0, 0, 0, 0] 
            } 
        });
    } catch (error) {
        console.error('getAdoptionTrends error:', error);
        return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลแนวโน้มการหาบ้านได้' });
    }
}

// ==========================================
// Helper functions for CSV & Excel styling
// ==========================================

function toCsvRow(items) {
    return items.map(val => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    }).join(',');
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
}

function styleWorksheet(worksheet, primaryColor = 'FF1E40AF') {
    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: primaryColor }
        };
        cell.font = {
            name: 'Segoe UI',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
    });

    // Style Data Rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.height = 22;
            const isEven = rowNumber % 2 === 0;
            row.eachCell((cell) => {
                cell.font = { name: 'Segoe UI', size: 10 };
                cell.alignment = { vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
                if (isEven) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8FAFC' }
                    };
                }
            });
        }
    });

    // Auto fit column widths
    worksheet.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const len = cell.value ? cell.value.toString().length : 0;
            if (len > maxLen) maxLen = len;
        });
        column.width = Math.max(maxLen + 4, 14);
    });
}

/**
 * ส่งออกข้อมูลรายงานสถิติ แดชบอร์ด ผู้ใช้งาน คำขอรับเลี้ยง และแนวโน้มรายเดือน
 * GET /api/admin/dashboard/export
 * Query Parameters:
 *   - type: 'all' | 'summary' | 'users' | 'applications' | 'trends'
 *   - format: 'excel' | 'xlsx' | 'csv'
 *   - status: filter status สำหรับคำขอรับเลี้ยง
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 */
async function exportDashboardReport(req, res) {
    try {
        const {
            type = 'all',
            format = 'excel',
            status,
            startDate,
            endDate
        } = req.query;

        const isCsv = format.toLowerCase() === 'csv';
        const timestamp = new Date().toISOString().slice(0, 10);
        const filenameBase = `pet_adoption_report_${type}_${timestamp}`;

        // 1. Fetch Summary Data
        const [
            [[totalUsers]],
            [[activeUsers]],
            [[bannedUsers]],
            [[totalCats]],
            [[availableCats]],
            [[adoptedCats]],
            [[totalApps]],
            [[approvedApps]],
            [[pendingApps]],
            [[rejectedApps]],
            [[totalAssessments]],
            [[totalReports]]
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS count FROM users`),
            pool.query(`SELECT COUNT(*) AS count FROM users WHERE is_banned = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM users WHERE is_banned = 1`),
            pool.query(`SELECT COUNT(*) AS count FROM cats`),
            pool.query(`SELECT COUNT(*) AS count FROM cats WHERE status = 'available' AND is_hidden = 0`),
            pool.query(`SELECT COUNT(*) AS count FROM cats WHERE status = 'adopted'`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications WHERE status = 'approved'`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications WHERE status = 'pending'`),
            pool.query(`SELECT COUNT(*) AS count FROM adoptionapplications WHERE status = 'rejected'`),
            pool.query(`SELECT COUNT(*) AS count FROM assessments`),
            pool.query(`SELECT COUNT(*) AS count FROM reports`).catch(() => [[{ count: 0 }]])
        ]);

        const summaryRows = [
            { topic: 'ผู้ใช้งานทั้งหมดในระบบ', value: totalUsers?.count || 0, desc: 'จำนวนบัญชีผู้ใช้ทั้งหมด' },
            { topic: 'ผู้ใช้งานที่ใช้งานได้ปกติ (Active)', value: activeUsers?.count || 0, desc: 'บัญชีที่ไม่ถูกระงับ' },
            { topic: 'ผู้ใช้งานที่ถูกระงับสิทธิ์ (Banned)', value: bannedUsers?.count || 0, desc: 'บัญชีที่ถูกแบน' },
            { topic: 'แมวทั้งหมดในระบบ', value: totalCats?.count || 0, desc: 'จำนวนโพสต์แมวทั้งหมด' },
            { topic: 'แมวที่กำลังหาบ้าน (Available)', value: availableCats?.count || 0, desc: 'พร้อมให้รับเลี้ยงและเปิดแสดง' },
            { topic: 'แมวที่หาบ้านสำเร็จแล้ว (Adopted)', value: adoptedCats?.count || 0, desc: 'ได้บ้านที่อบอุ่นแล้ว' },
            { topic: 'คำขอรับเลี้ยงทั้งหมด', value: totalApps?.count || 0, desc: 'คำขอที่ส่งเข้ามาทั้งหมด' },
            { topic: 'คำขอที่อนุมัติแล้ว (Approved)', value: approvedApps?.count || 0, desc: 'ผ่านการประเมินและอนุมัติรับเลี้ยง' },
            { topic: 'คำขอที่รอการตรวจสอบ (Pending)', value: pendingApps?.count || 0, desc: 'อยู่ระหว่างดำเนินการ' },
            { topic: 'คำขอที่ไม่ผ่านการพิจารณา (Rejected)', value: rejectedApps?.count || 0, desc: 'ไม่ผ่านเกณฑ์การประเมิน' },
            { topic: 'แบบประเมินความพร้อมทั้งหมด', value: totalAssessments?.count || 0, desc: 'การประเมินที่บันทึกในระบบ' },
            { topic: 'ข้อร้องเรียนในระบบ (Reports)', value: totalReports?.count || 0, desc: 'รายการรายงานปัญหาทั้งหมด' }
        ];

        // 2. Fetch Users Data
        const [usersList] = await pool.query(`
            SELECT 
                u.user_id,
                u.username,
                u.fullname,
                u.email,
                u.phonenumber,
                u.role,
                CASE WHEN u.is_banned = 1 THEN 'Banned' ELSE 'Active' END AS status,
                u.ban_reason,
                u.created_at
            FROM users u
            ORDER BY u.user_id ASC
        `);

        // 3. Fetch Adoption Applications Data
        let appQuery = `
            SELECT 
                a.match_id,
                a.cat_id,
                COALESCE(c.pet_name, 'ไม่ระบุ') AS cat_name,
                COALESCE(c.pet_breed, 'ไม่ระบุ') AS pet_breed,
                a.applicant_id,
                COALESCE(u.fullname, u.username, 'ไม่ระบุ') AS applicant_name,
                u.username AS applicant_username,
                u.email AS applicant_email,
                u.phonenumber AS applicant_phone,
                a.matchscore,
                a.status,
                a.applied_at
            FROM adoptionapplications a
            LEFT JOIN cats c ON a.cat_id = c.cat_id
            LEFT JOIN users u ON a.applicant_id = u.user_id
            WHERE 1=1
        `;
        const appParams = [];
        if (status && status !== 'ทั้งหมด' && status !== 'All') {
            appQuery += ' AND a.status = ?';
            appParams.push(status);
        }
        if (startDate) {
            appQuery += ' AND a.applied_at >= ?';
            appParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            appQuery += ' AND a.applied_at <= ?';
            appParams.push(`${endDate} 23:59:59`);
        }
        appQuery += ' ORDER BY a.applied_at DESC';
        const [applicationsList] = await pool.query(appQuery, appParams);

        // 4. Fetch Monthly Trends Data
        const [trendsList] = await pool.query(`
            SELECT 
                DATE_FORMAT(applied_at, '%Y-%m') AS month_key,
                COUNT(*) AS total_applications,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
            FROM adoptionapplications
            WHERE applied_at IS NOT NULL
            GROUP BY DATE_FORMAT(applied_at, '%Y-%m')
            ORDER BY month_key ASC
        `);

        // 5. Fetch Cat Breeds Data
        const [breedsList] = await pool.query(`
            SELECT 
                COALESCE(pet_breed, 'ไม่ระบุสายพันธุ์') AS breed,
                COUNT(*) AS total_count,
                SUM(CASE WHEN status = 'adopted' THEN 1 ELSE 0 END) AS adopted_count,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
            FROM cats
            GROUP BY COALESCE(pet_breed, 'ไม่ระบุสายพันธุ์')
            ORDER BY total_count DESC
        `);

        const thaiMonths = {
            '01': 'มกราคม', '02': 'กุมภาพันธ์', '03': 'มีนาคม', '04': 'เมษายน',
            '05': 'พฤษภาคม', '06': 'มิถุนายน', '07': 'กรกฎาคม', '08': 'สิงหาคม',
            '09': 'กันยายน', '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม'
        };

        const formattedTrends = trendsList.map(t => {
            const parts = (t.month_key || '').split('-');
            const year = parts[0] || '';
            const month = parts[1] || '';
            const monthName = (thaiMonths[month] || month) + (year ? ` ${year}` : '');
            const total = Number(t.total_applications || 0);
            const approved = Number(t.approved_count || 0);
            const rate = total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '0%';
            return {
                month_key: t.month_key || '-',
                month_name: monthName,
                total_applications: total,
                approved_count: approved,
                rejected_count: Number(t.rejected_count || 0),
                pending_count: Number(t.pending_count || 0),
                success_rate: rate
            };
        });

        // 6. Fetch Daily Breakdown Data (สถิติสแกนย่อยจำแนกตามวันที่)
        const [catsByDay] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') AS date_key,
                COUNT(*) AS new_cats,
                SUM(CASE WHEN status = 'adopted' THEN 1 ELSE 0 END) AS adopted_cats
            FROM cats
            WHERE created_at IS NOT NULL
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        `);

        const [appsByDay] = await pool.query(`
            SELECT 
                DATE_FORMAT(applied_at, '%Y-%m-%d') AS date_key,
                COUNT(*) AS new_applications
            FROM adoptionapplications
            WHERE applied_at IS NOT NULL
            GROUP BY DATE_FORMAT(applied_at, '%Y-%m-%d')
        `);

        const [usersByDay] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') AS date_key,
                COUNT(*) AS new_users
            FROM users
            WHERE created_at IS NOT NULL
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        `);

        const dailyMap = {};

        catsByDay.forEach(r => {
            if (!r.date_key) return;
            if (!dailyMap[r.date_key]) {
                dailyMap[r.date_key] = { date_key: r.date_key, new_cats: 0, adopted_cats: 0, new_applications: 0, new_users: 0 };
            }
            dailyMap[r.date_key].new_cats = Number(r.new_cats || 0);
            dailyMap[r.date_key].adopted_cats = Number(r.adopted_cats || 0);
        });

        appsByDay.forEach(r => {
            if (!r.date_key) return;
            if (!dailyMap[r.date_key]) {
                dailyMap[r.date_key] = { date_key: r.date_key, new_cats: 0, adopted_cats: 0, new_applications: 0, new_users: 0 };
            }
            dailyMap[r.date_key].new_applications = Number(r.new_applications || 0);
        });

        usersByDay.forEach(r => {
            if (!r.date_key) return;
            if (!dailyMap[r.date_key]) {
                dailyMap[r.date_key] = { date_key: r.date_key, new_cats: 0, adopted_cats: 0, new_applications: 0, new_users: 0 };
            }
            dailyMap[r.date_key].new_users = Number(r.new_users || 0);
        });

        const dailyList = Object.values(dailyMap).sort((a, b) => b.date_key.localeCompare(a.date_key));

        const formattedDaily = dailyList.map(d => {
            const dateStr = d.date_key ? formatDate(d.date_key) : '-';
            return {
                date_key: d.date_key,
                date_formatted: dateStr,
                new_cats: Number(d.new_cats || 0),
                adopted_cats: Number(d.adopted_cats || 0),
                new_applications: Number(d.new_applications || 0),
                new_users: Number(d.new_users || 0)
            };
        });

        // ==========================================
        // 5. Handle CSV Export
        // ==========================================
        if (isCsv) {
            let csvRows = [];

            if (type === 'users') {
                csvRows.push(toCsvRow(['User ID', 'Username', 'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'บทบาท', 'สถานะ', 'เหตุผลการแบน', 'วันที่ลงทะเบียน']));
                usersList.forEach(u => {
                    csvRows.push(toCsvRow([
                        u.user_id,
                        u.username,
                        u.fullname || '-',
                        u.email || '-',
                        u.phonenumber || '-',
                        u.role,
                        u.status,
                        u.ban_reason || '-',
                        formatDate(u.created_at)
                    ]));
                });
            } else if (type === 'applications') {
                csvRows.push(toCsvRow(['Match ID', 'ชื่อแมว', 'สายพันธุ์', 'ชื่อผู้สมัคร', 'Username', 'อีเมล', 'เบอร์โทร', 'คะแนนความเหมาะสม (%)', 'สถานะคำขอ', 'วันที่ยื่นคำขอ']));
                applicationsList.forEach(a => {
                    csvRows.push(toCsvRow([
                        a.match_id,
                        a.cat_name,
                        a.pet_breed,
                        a.applicant_name,
                        a.applicant_username || '-',
                        a.applicant_email || '-',
                        a.applicant_phone || '-',
                        a.matchscore || '0',
                        a.status,
                        formatDate(a.applied_at)
                    ]));
                });
            } else if (type === 'trends' || type === 'monthly') {
                csvRows.push(toCsvRow(['รหัสเดือน', 'ชื่อเดือน', 'คำขอทั้งหมด', 'รับเลี้ยงสำเร็จ (Approved)', 'ไม่ผ่านเกณฑ์ (Rejected)', 'รอตรวจสอบ (Pending)', 'อัตราความสำเร็จ (%)']));
                formattedTrends.forEach(t => {
                    csvRows.push(toCsvRow([
                        t.month_key,
                        t.month_name,
                        t.total_applications,
                        t.approved_count,
                        t.rejected_count,
                        t.pending_count,
                        t.success_rate
                    ]));
                });
            } else if (type === 'breeds') {
                csvRows.push(toCsvRow(['สายพันธุ์', 'จำนวนแมวทั้งหมด (ตัว)', 'รับเลี้ยงแล้ว (Adopted)', 'กำลังหาบ้าน (Available)', 'รอส่งมอบ (Pending)', 'สัดส่วน (%)']));
                const totalAllCats = breedsList.reduce((acc, b) => acc + Number(b.total_count), 0) || 1;
                breedsList.forEach(b => {
                    const pct = ((Number(b.total_count) / totalAllCats) * 100).toFixed(1) + '%';
                    csvRows.push(toCsvRow([
                        b.breed,
                        Number(b.total_count),
                        Number(b.adopted_count),
                        Number(b.available_count),
                        Number(b.pending_count),
                        pct
                    ]));
                });
            } else if (type === 'charts') {
                csvRows.push(toCsvRow(['=== 1. สถิติการรับเลี้ยงรายเดือน (Monthly Trends) ===']));
                csvRows.push(toCsvRow(['รหัสเดือน', 'ชื่อเดือน', 'คำขอทั้งหมด', 'รับเลี้ยงสำเร็จ (Approved)', 'ไม่ผ่านเกณฑ์ (Rejected)', 'รอตรวจสอบ (Pending)', 'อัตราความสำเร็จ (%)']));
                formattedTrends.forEach(t => {
                    csvRows.push(toCsvRow([
                        t.month_key,
                        t.month_name,
                        t.total_applications,
                        t.approved_count,
                        t.rejected_count,
                        t.pending_count,
                        t.success_rate
                    ]));
                });
                csvRows.push('');
                csvRows.push(toCsvRow(['=== 2. สัดส่วนประเภทผู้ใช้งาน (User Types) ===']));
                csvRows.push(toCsvRow(['ประเภทผู้ใช้งาน', 'จำนวน (บัญชี)', 'สถานะ']));
                csvRows.push(toCsvRow(['ผู้ใช้งานทั้งหมด', totalUsers?.count || 0, 'ทั้งหมด']));
                csvRows.push(toCsvRow(['ผู้ใช้งานปกติ (Active)', activeUsers?.count || 0, 'ปกติ']));
                csvRows.push(toCsvRow(['ผู้ใช้งานที่ถูกระงับ (Banned)', bannedUsers?.count || 0, 'ถูกแบน']));
                csvRows.push('');
                csvRows.push(toCsvRow(['=== 3. สถิติสายพันธุ์แมว (Popular Cat Breeds) ===']));
                csvRows.push(toCsvRow(['สายพันธุ์', 'จำนวนแมวทั้งหมด (ตัว)', 'รับเลี้ยงแล้ว (Adopted)', 'กำลังหาบ้าน (Available)', 'รอส่งมอบ (Pending)', 'สัดส่วน (%)']));
                const totalAllCats = breedsList.reduce((acc, b) => acc + Number(b.total_count), 0) || 1;
                breedsList.forEach(b => {
                    const pct = ((Number(b.total_count) / totalAllCats) * 100).toFixed(1) + '%';
                    csvRows.push(toCsvRow([
                        b.breed,
                        Number(b.total_count),
                        Number(b.adopted_count),
                        Number(b.available_count),
                        Number(b.pending_count),
                        pct
                    ]));
                });
                csvRows.push('');
                csvRows.push(toCsvRow(['=== 4. สถิติจำแนกตามวันที่ (Daily Breakdown by Date) ===']));
                csvRows.push(toCsvRow(['วันที่ (YYYY-MM-DD)', 'วันที่ (รูปแบบไทย)', 'แมวเข้าใหม่ (ตัว)', 'รับเลี้ยงสำเร็จ (ตัว)', 'คำขอรับเลี้ยงใหม่ (ใบ)', 'ผู้ใช้ใหม่ (คน)']));
                formattedDaily.forEach(d => {
                    csvRows.push(toCsvRow([
                        d.date_key,
                        d.date_formatted,
                        d.new_cats,
                        d.adopted_cats,
                        d.new_applications,
                        d.new_users
                    ]));
                });
            } else {
                // Summary or default all
                csvRows.push(toCsvRow(['หัวข้อสถิติ', 'จำนวน (ค่า)', 'คำอธิบาย']));
                summaryRows.forEach(s => {
                    csvRows.push(toCsvRow([s.topic, s.value, s.desc]));
                });
                csvRows.push('');
                csvRows.push(toCsvRow(['=== สถิติจำแนกตามวันที่ (Daily Breakdown by Date) ===']));
                csvRows.push(toCsvRow(['วันที่ (YYYY-MM-DD)', 'วันที่ (รูปแบบไทย)', 'แมวเข้าใหม่ (ตัว)', 'รับเลี้ยงสำเร็จ (ตัว)', 'คำขอรับเลี้ยงใหม่ (ใบ)', 'ผู้ใช้ใหม่ (คน)']));
                formattedDaily.forEach(d => {
                    csvRows.push(toCsvRow([
                        d.date_key,
                        d.date_formatted,
                        d.new_cats,
                        d.adopted_cats,
                        d.new_applications,
                        d.new_users
                    ]));
                });
            }

            // UTF-8 BOM (\uFEFF) for Excel Thai encoding support
            const csvData = '\uFEFF' + csvRows.join('\r\n');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
            return res.status(200).send(Buffer.from(csvData, 'utf8'));
        }

        // ==========================================
        // 6. Handle Excel (.xlsx) Export using ExcelJS
        // ==========================================
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Pet Adoption System Admin';
        workbook.lastModifiedBy = req.user?.username || 'Admin';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Sheet 1: ภาพรวมระบบ (Summary)
        if (type === 'all' || type === 'summary') {
            const summarySheet = workbook.addWorksheet('ภาพรวมระบบ (Overview)');
            summarySheet.columns = [
                { header: 'หัวข้อสถิติภาพรวม', key: 'topic', width: 35 },
                { header: 'จำนวน (รายการ/คน)', key: 'value', width: 22 },
                { header: 'คำอธิบายข้อมูล', key: 'desc', width: 45 }
            ];
            summaryRows.forEach(row => summarySheet.addRow(row));
            styleWorksheet(summarySheet, 'FF1E3A8A'); // Dark Blue header
        }

        // Sheet 2: ผู้ใช้งาน (Users)
        if (type === 'all' || type === 'users') {
            const usersSheet = workbook.addWorksheet('สถิติผู้ใช้งาน (Users)');
            usersSheet.columns = [
                { header: 'User ID', key: 'user_id', width: 12 },
                { header: 'Username', key: 'username', width: 20 },
                { header: 'ชื่อ-นามสกุล', key: 'fullname', width: 25 },
                { header: 'อีเมล', key: 'email', width: 28 },
                { header: 'เบอร์โทรศัพท์', key: 'phonenumber', width: 18 },
                { header: 'บทบาท (Role)', key: 'role', width: 14 },
                { header: 'สถานะ (Status)', key: 'status', width: 15 },
                { header: 'เหตุผลการแบน', key: 'ban_reason', width: 30 },
                { header: 'วันที่ลงทะเบียน', key: 'created_at', width: 22 }
            ];
            usersList.forEach(u => {
                usersSheet.addRow({
                    user_id: u.user_id,
                    username: u.username,
                    fullname: u.fullname || '-',
                    email: u.email || '-',
                    phonenumber: u.phonenumber || '-',
                    role: u.role,
                    status: u.status,
                    ban_reason: u.ban_reason || '-',
                    created_at: formatDate(u.created_at)
                });
            });
            styleWorksheet(usersSheet, 'FF047857'); // Emerald Green header
        }

        // Sheet 3: คำขอรับเลี้ยง (Applications)
        if (type === 'all' || type === 'applications') {
            const appsSheet = workbook.addWorksheet('คำขอรับเลี้ยง (Applications)');
            appsSheet.columns = [
                { header: 'Match ID', key: 'match_id', width: 12 },
                { header: 'ชื่อแมว', key: 'cat_name', width: 20 },
                { header: 'สายพันธุ์', key: 'pet_breed', width: 22 },
                { header: 'ชื่อผู้สมัคร', key: 'applicant_name', width: 25 },
                { header: 'Username', key: 'applicant_username', width: 18 },
                { header: 'อีเมล', key: 'applicant_email', width: 26 },
                { header: 'เบอร์โทร', key: 'applicant_phone', width: 16 },
                { header: 'Match Score (%)', key: 'matchscore', width: 18 },
                { header: 'สถานะคำขอ', key: 'status', width: 16 },
                { header: 'วันที่ยื่นคำขอ', key: 'applied_at', width: 22 }
            ];
            applicationsList.forEach(a => {
                appsSheet.addRow({
                    match_id: a.match_id,
                    cat_name: a.cat_name,
                    pet_breed: a.pet_breed,
                    applicant_name: a.applicant_name,
                    applicant_username: a.applicant_username || '-',
                    applicant_email: a.applicant_email || '-',
                    applicant_phone: a.applicant_phone || '-',
                    matchscore: Number(a.matchscore || 0),
                    status: a.status,
                    applied_at: formatDate(a.applied_at)
                });
            });
            styleWorksheet(appsSheet, 'FF7C3AED'); // Violet header
        }

        // Sheet 4: สถิติจำแนกตามวันที่ (Daily Breakdown)
        if (type === 'all' || type === 'charts' || type === 'daily') {
            const dailySheet = workbook.addWorksheet('สถิติตามวันที่ (Daily)');
            dailySheet.columns = [
                { header: 'วันที่ (YYYY-MM-DD)', key: 'date_key', width: 22 },
                { header: 'วันที่ (รูปแบบไทย)', key: 'date_formatted', width: 25 },
                { header: 'แมวเข้าใหม่ (ตัว)', key: 'new_cats', width: 20 },
                { header: 'รับเลี้ยงสำเร็จแล้ว (ตัว)', key: 'adopted_cats', width: 24 },
                { header: 'คำขอรับเลี้ยงใหม่ (ใบ)', key: 'new_applications', width: 24 },
                { header: 'ผู้ใช้สมัครใหม่ (คน)', key: 'new_users', width: 22 }
            ];
            formattedDaily.forEach(d => {
                dailySheet.addRow(d);
            });
            styleWorksheet(dailySheet, 'FF0284C7'); // Sky Blue header
        }

        // Sheet 5: แนวโน้มการรับเลี้ยงรายเดือน (Monthly Trends)
        if (type === 'all' || type === 'charts' || type === 'trends' || type === 'monthly') {
            const trendsSheet = workbook.addWorksheet('สถิติรายเดือน (Trends)');
            trendsSheet.columns = [
                { header: 'รหัสเดือน (YYYY-MM)', key: 'month_key', width: 20 },
                { header: 'ชื่อเดือน (ไทย)', key: 'month_name', width: 24 },
                { header: 'คำขอทั้งหมด (ใบ)', key: 'total_applications', width: 20 },
                { header: 'รับเลี้ยงสำเร็จ (Approved)', key: 'approved_count', width: 24 },
                { header: 'ไม่ผ่านเกณฑ์ (Rejected)', key: 'rejected_count', width: 22 },
                { header: 'รอตรวจสอบ (Pending)', key: 'pending_count', width: 22 },
                { header: 'อัตราความสำเร็จ (%)', key: 'success_rate', width: 20 }
            ];
            formattedTrends.forEach(t => {
                trendsSheet.addRow(t);
            });
            styleWorksheet(trendsSheet, 'FFD97706'); // Amber/Orange header
        }

        // Sheet 5: สถิติสายพันธุ์แมว (Breeds)
        if (type === 'all' || type === 'charts' || type === 'breeds') {
            const breedsSheet = workbook.addWorksheet('สถิติสายพันธุ์แมว (Breeds)');
            breedsSheet.columns = [
                { header: 'สายพันธุ์แมว', key: 'breed', width: 25 },
                { header: 'จำนวนแมวทั้งหมด (ตัว)', key: 'total_count', width: 24 },
                { header: 'รับเลี้ยงสำเร็จแล้ว (Adopted)', key: 'adopted_count', width: 25 },
                { header: 'กำลังหาบ้าน (Available)', key: 'available_count', width: 24 },
                { header: 'รอตรวจสอบ/ส่งมอบ (Pending)', key: 'pending_count', width: 25 },
                { header: 'สัดส่วนความนิยม (%)', key: 'pct', width: 20 }
            ];
            const totalAllCats = breedsList.reduce((acc, b) => acc + Number(b.total_count), 0) || 1;
            breedsList.forEach(b => {
                const pct = ((Number(b.total_count) / totalAllCats) * 100).toFixed(1) + '%';
                breedsSheet.addRow({
                    breed: b.breed,
                    total_count: Number(b.total_count),
                    adopted_count: Number(b.adopted_count),
                    available_count: Number(b.available_count),
                    pending_count: Number(b.pending_count),
                    pct
                });
            });
            styleWorksheet(breedsSheet, 'FF7C3AED'); // Violet header
        }

        // Sheet 6: สัดส่วนผู้ใช้งาน (User Types) - เมื่อ export เฉพาะชุดกราฟ
        if (type === 'charts') {
            const userTypesSheet = workbook.addWorksheet('สัดส่วนผู้ใช้งาน (User Types)');
            userTypesSheet.columns = [
                { header: 'ประเภท / สถานะผู้ใช้งาน', key: 'type', width: 28 },
                { header: 'จำนวน (บัญชี)', key: 'count', width: 20 },
                { header: 'คำอธิบาย', key: 'desc', width: 30 }
            ];
            userTypesSheet.addRow({ type: 'ผู้ใช้งานทั้งหมดในระบบ', count: Number(totalUsers?.count || 0), desc: 'บัญชีผู้ใช้ทั้งหมด' });
            userTypesSheet.addRow({ type: 'ผู้ใช้งานปกติ (Active)', count: Number(activeUsers?.count || 0), desc: 'บัญชีที่ไม่ถูกระงับสิทธิ์' });
            userTypesSheet.addRow({ type: 'ผู้ใช้งานที่ถูกระงับ (Banned)', count: Number(bannedUsers?.count || 0), desc: 'บัญชีที่ถูกระงับการใช้งาน' });
            styleWorksheet(userTypesSheet, 'FF2563EB'); // Blue header
        }

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
        return res.status(200).send(buffer);

    } catch (error) {
        console.error('exportDashboardReport error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message });
    }
}

module.exports = {
    getDashboardStats,
    getLatestActivity,
    getMonthlyAdoptionTrends,
    exportDashboardReport
};