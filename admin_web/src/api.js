const API_BASE = 'http://localhost:3000/api';

export function getAuthToken() {
  return localStorage.getItem('adminToken');
}

export function setAuthSession(token, user) {
  localStorage.setItem('adminToken', token);
  if (user) {
    localStorage.setItem('adminUser', JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      if (token) {
        clearAuthSession();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      throw new Error(data.message || 'เซสชันหมดอายุหรือไม่มีสิทธิ์การใช้งาน กรุณาเข้าสู่ระบบใหม่');
    }

    if (!response.ok) {
      throw new Error(data.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${response.status})`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${path}]:`, err);
    throw err;
  }
}

export const adminApi = {
  // Auth
  login: async (username, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.success && res.role === 'admin') {
      setAuthSession(res.token, { id: res.userId, username: res.username });
    }
    return res;
  },

  // Dashboard
  getStats: () => request('/admin/dashboard/stats'),
  getActivity: () => request('/admin/dashboard/activity'),
  getTrends: () => request('/admin/dashboard/trends'),
  exportDashboardReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE}/admin/dashboard/export?${query}`;
  },
  downloadReport: async (params = {}) => {
    const token = getAuthToken();
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/admin/dashboard/export?${query}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'ดาวน์โหลดรายงานล้มเหลว');
    }
    const rawBlob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';

    // Determine extension and fallback filename
    const isCsv = (params.format || '').toLowerCase() === 'csv';
    const ext = isCsv ? 'csv' : 'xlsx';
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `pet_adoption_report_${params.type || 'all'}_${dateStr}.${ext}`;

    if (disposition && disposition.includes('filename=')) {
      const parts = disposition.split('filename=');
      if (parts[1]) {
        filename = parts[1].split(';')[0].replace(/["']/g, '').trim();
      }
    }

    // Explicitly set correct MIME type for the blob so Windows knows file type
    const mimeType = isCsv
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([rawBlob], { type: mimeType });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Delay cleanup to allow browser download manager to initiate and read filename
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }, 10000);

    return { success: true, filename };
  },

  // Cats
  getCats: () => request('/admin/cats'),
  hideCat: (id) => request(`/admin/cats/${id}/hide`, { method: 'PUT' }),
  unhideCat: (id) => request(`/admin/cats/${id}/unhide`, { method: 'PUT' }),
  deleteCat: (id) => request(`/admin/cats/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/users${query}`);
  },
  getUserDetail: (id) => request(`/admin/users/${id}`),
  toggleUserBan: (id, isBanned, reason) => request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ is_banned: isBanned ? 1 : 0, ban_reason: reason }),
  }),

  // Criteria
  getCriteria: () => request('/admin/criteria'),
  createCriteria: (data) => request('/admin/criteria', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCriteria: (id, data) => request(`/admin/criteria/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCriteria: (id) => request(`/admin/criteria/${id}`, {
    method: 'DELETE',
  }),

  // Assessments
  getAssessments: () => request('/admin/assessments'),
  getAssessmentById: (id) => request(`/admin/assessments/${id}`),
  updateAssessmentStatus: (id, status) => request(`/admin/assessments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  getAssessmentStatsSummary: () => request('/admin/assessments/stats/summary'),

  // Adoption Applications
  getApplications: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/applications${query}`);
  },
  getApplicationById: (id) => request(`/admin/applications/${id}`),
  overrideApplicationStatus: (id, status, reason) => request(`/admin/applications/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  }),

  // Reports & Pending Actions
  getReports: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/reports${query}`);
  },
  getReportDetail: (id) => request(`/admin/reports/${id}`),
  updateReportStatus: (id, action, reason) => request(`/admin/reports/${id}/update`, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  }),

  // Audit Logs
  getAuditLogs: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/logs${query}`);
  },
  getAuditLogActions: () => request('/admin/logs/actions'),
  getAuditLogById: (id) => request(`/admin/logs/${id}`),
};


