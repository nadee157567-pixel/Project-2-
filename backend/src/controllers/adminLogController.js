const pool = require('../config/database');

/**
 * 1. ดึงรายการ Audit Logs ทั้งหมด
 * GET /api/admin/logs
 * Query params:
 *   - page (default: 1)
 *   - limit (default: 20, max: 100)
 *   - action (filter by action name, e.g. BAN_USER, DELETE_CAT)
 *   - admin_id (filter by specific admin)
 *   - search (keyword in action, details, admin username/fullname)
 *   - startDate / start_date (YYYY-MM-DD)
 *   - endDate / end_date (YYYY-MM-DD)
 */
async function getLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      admin_id,
      search,
      startDate,
      start_date,
      endDate,
      end_date
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    // Filter ตาม Action
    if (action && action.trim() !== '' && action !== 'ทั้งหมด' && action !== 'All') {
      conditions.push('l.action = ?');
      params.push(action.trim());
    }

    // Filter ตาม Admin ID
    if (admin_id) {
      conditions.push('l.admin_id = ?');
      params.push(parseInt(admin_id, 10));
    }

    // Search keyword
    if (search && search.trim() !== '') {
      conditions.push('(l.action LIKE ? OR l.details LIKE ? OR u.username LIKE ? OR u.fullname LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    // Date range
    const fromDate = startDate || start_date;
    if (fromDate) {
      conditions.push('l.created_at >= ?');
      params.push(`${fromDate} 00:00:00`);
    }

    const toDate = endDate || end_date;
    if (toDate) {
      conditions.push('l.created_at <= ?');
      params.push(`${toDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. นับจำนวนรวมทั้งหมด
    const countSql = `
      SELECT COUNT(*) AS total
      FROM admin_logs l
      LEFT JOIN users u ON l.admin_id = u.user_id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // 2. ดึงรายการข้อมูลตาม Pagination
    const dataSql = `
      SELECT 
        l.log_id,
        l.log_id AS id,
        l.admin_id,
        u.username AS admin_username,
        u.fullname AS admin_fullname,
        u.email AS admin_email,
        l.action,
        l.details,
        l.created_at
      FROM admin_logs l
      LEFT JOIN users u ON l.admin_id = u.user_id
      ${whereClause}
      ORDER BY l.created_at DESC, l.log_id DESC
      LIMIT ? OFFSET ?
    `;

    // Note: limit and offset must be numbers
    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

    // Format ข้อมูลวันที่ให้อ่านง่าย
    const formattedLogs = rows.map(log => {
      const d = new Date(log.created_at);
      return {
        ...log,
        formatted_date: !isNaN(d.getTime())
          ? d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
          : 'N/A'
      };
    });

    res.json({
      success: true,
      logs: formattedLogs,
      data: formattedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in getLogs:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}

/**
 * 2. ดูรายละเอียด Log รายการเดียว
 * GET /api/admin/logs/:id
 */
async function getLogDetail(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        l.log_id,
        l.log_id AS id,
        l.admin_id,
        u.username AS admin_username,
        u.fullname AS admin_fullname,
        u.email AS admin_email,
        l.action,
        l.details,
        l.created_at
      FROM admin_logs l
      LEFT JOIN users u ON l.admin_id = u.user_id
      WHERE l.log_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบประวัติ Audit Log ที่ระบุ' });
    }

    const log = rows[0];
    const d = new Date(log.created_at);

    res.json({
      success: true,
      data: {
        ...log,
        formatted_date: !isNaN(d.getTime())
          ? d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
          : 'N/A'
      }
    });
  } catch (error) {
    console.error('Error in getLogDetail:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}

/**
 * 3. ดึงรายการประเภท Action ทั้งหมดที่มีในระบบ (สำหรับ Dropdown filter หรือ Dashboard)
 * GET /api/admin/logs/actions
 */
async function getLogActions(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        action,
        COUNT(*) AS count,
        MAX(created_at) AS last_occurred
      FROM admin_logs
      GROUP BY action
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: rows,
      actions: rows.map(r => r.action)
    });
  } catch (error) {
    console.error('Error in getLogActions:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}

module.exports = {
  getLogs,
  getLogDetail,
  getLogActions
};
