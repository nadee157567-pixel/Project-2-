import React, { useState } from 'react';
import {
  Users, UserPlus, FileText, Cat, Home, Heart,
  MoreVertical, Menu, LayoutGrid, FileSpreadsheet, Filter, ClipboardList, Trash2, Edit, Plus, User, Search, Settings2, X, AlertCircle, Ban, XCircle, CheckCircle, ExternalLink, Eye, EyeOff
} from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList, Label
} from 'recharts';
import { statsData, monthlyAdoptionData, userTypesData, catBreedsDataAll, catBreedsDataPosters, catBreedsDataAdopters, pendingActionsData, evaluationCriteriaData, usersListData, catsListData } from './mockData';
import './index.css';

let globalPendingActions = [...pendingActionsData];
let globalUsersList = [...usersListData];
let globalCatsList = [...catsListData];

// --- Components ---

const StatCard = ({ icon: Icon, title, value, unit, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <Icon size={20} style={{ color: color || 'var(--primary-dark)' }} />
      <span>{title}</span>
    </div>
    <div className="stat-value" style={{ color: color || 'var(--primary-dark)' }}>
      {value} <span className="stat-unit">{unit}</span>
    </div>
  </div>
);

// Distinct colors for the donut/pie chart to make data clear
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const CatManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [appliedBreeds, setAppliedBreeds] = useState([]);
  const [appliedStatuses, setAppliedStatuses] = useState([]);
  const [appliedMonths, setAppliedMonths] = useState([]);

  const breedsList = [
    'วิเชียรมาศ', 'ขาวมณี', 'เปอร์เซีย', 'สีสวาด',
    'สก็อตติช โฟลด์', 'อเมริกัน ช็อตแฮร์', 'ศุภลักษณ์',
    'แมวไทย', 'ไม่ทราบสายพันธุ์'
  ];

  const statusList = ['Active', 'Adopted'];

  const monthsList = [
    { label: 'มกราคม', value: '/01/' },
    { label: 'กุมภาพันธ์', value: '/02/' },
    { label: 'มีนาคม', value: '/03/' },
    { label: 'เมษายน', value: '/04/' }
  ];

  const handleToggleBreed = (breed) => {
    setSelectedBreeds(prev =>
      prev.includes(breed) ? prev.filter(b => b !== breed) : [...prev, breed]
    );
  };

  const handleToggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleToggleMonth = (monthValue) => {
    setSelectedMonths(prev =>
      prev.includes(monthValue) ? prev.filter(m => m !== monthValue) : [...prev, monthValue]
    );
  };

  const handleApplyFilter = () => {
    setAppliedBreeds(selectedBreeds);
    setAppliedStatuses(selectedStatuses);
    setAppliedMonths(selectedMonths);
    setIsFilterOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedBreeds([]);
    setSelectedStatuses([]);
    setSelectedMonths([]);
    setAppliedBreeds([]);
    setAppliedStatuses([]);
    setAppliedMonths([]);
    setIsFilterOpen(false);
  };

  const [localCatsList, setLocalCatsList] = useState(globalCatsList);
  const [catToHide, setCatToHide] = useState(null);
  const [catToUnhide, setCatToUnhide] = useState(null);
  const [catToView, setCatToView] = useState(null);

  const handleHideCat = (cat) => {
    setCatToHide(cat);
  };

  const handleUnhideCat = (cat) => {
    setCatToUnhide(cat);
  };

  const confirmHideCat = () => {
    if (catToHide) {
      const newCats = globalCatsList.map(cat => cat.id === catToHide.id ? { ...cat, status: 'Hidden' } : cat);
      globalCatsList = newCats;
      setLocalCatsList(newCats);

      // Link to Pending Actions
      globalPendingActions = globalPendingActions.map(p =>
        p.username === catToHide.poster && p.status !== 'Resolved' ? { ...p, status: 'Resolved' } : p
      );

      setCatToHide(null);
    }
  };

  const confirmUnhideCat = () => {
    if (catToUnhide) {
      const newCats = globalCatsList.map(cat => cat.id === catToUnhide.id ? { ...cat, status: 'Pending' } : cat);
      globalCatsList = newCats;
      setLocalCatsList(newCats);
      setCatToUnhide(null);
    }
  };



  const filteredCats = localCatsList.filter(cat => {
    const matchSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBreed = appliedBreeds.length === 0 || appliedBreeds.includes(cat.breed);
    const matchStatus = appliedStatuses.length === 0 || appliedStatuses.includes(cat.status);
    const matchMonth = appliedMonths.length === 0 || appliedMonths.some(m => cat.date.includes(m));
    return matchSearch && matchBreed && matchStatus && matchMonth;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredCats.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const currentCats = filteredCats.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Cat Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>จัดการประกาศแมวทั้งหมด</p>
      </div>

      <div className="search-bar-container">
        <Search className="icon" size={20} style={{ marginRight: '8px' }} />
        <input
          type="text"
          placeholder="ค้นหา ชื่อ, สายพันธุ์..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div style={{ position: 'relative' }}>
          <Settings2 className="icon" size={20} style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => setIsFilterOpen(true)} />
          {(appliedBreeds.length > 0 || appliedStatuses.length > 0 || appliedMonths.length > 0) && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
          )}
        </div>
      </div>

      <div className="cats-grid">
        {currentCats.map((cat) => (
          <div key={cat.id} className="cat-card">
            <div className="cat-card-content">
              <img src={cat.image} alt={cat.name} className="cat-image" />
              <div className="cat-info">
                <h4>{cat.name} ({cat.breed})</h4>
                <p>ผู้โพสต์ : {cat.poster}</p>
                <p>วันที่ลงประกาศ : {cat.date}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  สถานะ
                  <span className={`status-badge ${cat.status.toLowerCase()}`}>{cat.status}</span>
                </p>
              </div>
            </div>
            <div className="cat-card-actions">
              <button className="btn-action-info btn-sm" onClick={() => setCatToView(cat)}>ดูรายละเอียด</button>
              {cat.status === 'Hidden' ? (
                <button className="btn-action-success btn-sm" onClick={() => handleUnhideCat(cat)}>ยกเลิกซ่อน</button>
              ) : (
                <button className="btn-action-danger btn-sm" onClick={() => handleHideCat(cat)}>ซ่อนประกาศ</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          className="btn-cancel"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          style={{ opacity: safePage === 1 ? 0.5 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
        >
          ก่อนหน้า
        </button>
        <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>หน้า {safePage} จาก {totalPages}</span>
        <button
          className="btn-cancel"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          style={{ opacity: safePage === totalPages ? 0.5 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          ถัดไป
        </button>
      </div>

      {isFilterOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setIsFilterOpen(false)} />

            <div className="filter-sections">
              <div className="filter-column">
                <div className="filter-heading">ค้นหาตามสายพันธุ์</div>
                {breedsList.map(breed => (
                  <div key={breed} className="checkbox-item" onClick={() => handleToggleBreed(breed)}>
                    <input
                      type="checkbox"
                      checked={selectedBreeds.includes(breed)}
                      readOnly
                    />
                    <label>{breed}</label>
                  </div>
                ))}
              </div>

              <div className="filter-column">
                <div className="filter-heading">สถานะ</div>
                {statusList.map(status => (
                  <div key={status} className="checkbox-item" onClick={() => handleToggleStatus(status)}>
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      readOnly
                    />
                    <label>{status}</label>
                  </div>
                ))}

                <div className="filter-heading" style={{ marginTop: '2rem' }}>เดือนที่ลงประกาศ</div>
                {monthsList.map(month => (
                  <div key={month.value} className="checkbox-item" onClick={() => handleToggleMonth(month.value)}>
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month.value)}
                      readOnly
                    />
                    <label>{month.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-text" onClick={handleApplyFilter}>ดูผลลัพธ์</button>
              <button className="btn-text" onClick={handleClearFilter}>ล้างค่า</button>
            </div>
          </div>
        </div>
      )}

      {/* Hide Cat Confirmation Modal */}
      {catToHide && (
        <div className="modal-overlay" onClick={() => setCatToHide(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setCatToHide(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <AlertCircle size={24} color="#ef4444" /> ยืนยันการซ่อนประกาศ
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการซ่อนประกาศ <strong>{catToHide.name}</strong>?<br />
              เมื่อซ่อนแล้ว ผู้ใช้งานท่านอื่นจะไม่เห็นประกาศนี้อีก
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setCatToHide(null)}>ยกเลิก</button>
              <button className="btn-action-danger" onClick={confirmHideCat}>
                ยืนยันการซ่อน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unhide Cat Confirmation Modal */}
      {catToUnhide && (
        <div className="modal-overlay" onClick={() => setCatToUnhide(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setCatToUnhide(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle size={24} color="#10b981" /> ยืนยันการยกเลิกซ่อน
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการซ่อนประกาศ <strong>{catToUnhide.name}</strong>?<br />
              ประกาศจะกลับมาแสดงผลให้ทุกคนเห็นได้อีกครั้ง
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setCatToUnhide(null)}>ยกเลิก</button>
              <button className="btn-action-success" onClick={confirmUnhideCat}>
                ยืนยันการยกเลิกซ่อน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cat Deep Dive Modal */}
      {catToView && (
        <div className="modal-overlay" onClick={() => setCatToView(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setCatToView(null)} />

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img src={catToView.image} alt={catToView.name} style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', margin: '0 auto 1rem auto', display: 'block', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{catToView.name} ({catToView.breed})</h2>
              <p style={{ color: '#4b5563', margin: '0 0 0.25rem 0' }}>โพสต์โดย: <strong>{catToView.poster}</strong></p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>วันที่ลงประกาศ: {catToView.date} | สถานะ: <span className={`status-badge ${catToView.status.toLowerCase()}`}>{catToView.status}</span></p>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', color: '#374151' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>เพศ:</strong> {catToView.id % 2 === 0 ? 'เพศผู้' : 'เพศเมีย'}</div>
                <div><strong>อายุ:</strong> {(catToView.id * 2) || 4} เดือน (ลูกแมว)</div>
                <div><strong>สายพันธุ์:</strong> {catToView.breed}</div>
                <div><strong>เคยรับวัคซีนแล้ว:</strong> {catToView.id % 3 === 0 ? 'ฉีดแล้ว' : 'ยังไม่ฉีด'}</div>
                <div><strong>ทำหมันแล้ว:</strong> {catToView.id % 2 === 0 ? 'ทำแล้ว' : 'ยังไม่ทำ'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>ลักษณะนิสัย:</strong> เข้ากับสัตว์อื่น: เข้ากันได้ดี (แมว)</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>สุขภาพ:</strong> แข็งแรงดี</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', color: '#374151' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>🎯 เงื่อนไขความพร้อมที่ต้องการ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div><strong>พื้นที่ที่ต้องการ:</strong> ต้องการพื้นที่พอประมาณ</div>
                <div><strong>เวลาที่ต้องให้:</strong> ต้องการคนที่มีเวลาเล่นด้วย</div>
                <div><strong>ค่าใช้จ่ายโดยประมาณ:</strong> 3000.00 บาท/เดือน</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', color: '#374151' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>👤 รายละเอียดผู้โพสต์</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>ชื่อผู้ใช้:</strong> {catToView.poster}</div>
                {globalUsersList.find(u => u.username === catToView.poster) ? (
                  <>
                    <div><strong>อีเมล:</strong> {globalUsersList.find(u => u.username === catToView.poster).email}</div>
                    <div><strong>เบอร์โทร:</strong> {globalUsersList.find(u => u.username === catToView.poster).phone}</div>
                    <div><strong>สถานะบัญชี:</strong> {globalUsersList.find(u => u.username === catToView.poster).status}</div>
                  </>
                ) : (
                  <div style={{ gridColumn: '1/-1', color: '#6b7280' }}>ไม่พบข้อมูลติดต่อเพิ่มเติม</div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>💌 คำขอรับเลี้ยง ({catToView.id % 4} รายการ)</h3>
              {(catToView.id % 4) > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {globalUsersList.slice(0, catToView.id % 4).map(u => (
                    <li key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <User size={20} color="#6b7280" />
                        <div>
                          <strong>{u.username}</strong><br />
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>ความพร้อม: สูงมาก (ผ่านเกณฑ์ 100%)</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>ดูโปรไฟล์</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>ยังไม่มีผู้ยื่นคำขอรับเลี้ยง</p>
              )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="btn-cancel" onClick={() => setCatToView(null)}>ปิดหน้าต่าง</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

const UserManagement = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [localUsersList, setLocalUsersList] = useState(globalUsersList);
  const [userToBan, setUserToBan] = useState(null);
  const [userToUnban, setUserToUnban] = useState(null);
  const [userToView, setUserToView] = useState(null);

  const handleBanUser = (user) => {
    setUserToBan(user);
  };

  const handleUnbanUser = (user) => {
    setUserToUnban(user);
  };

  const confirmBanUser = () => {
    if (userToBan) {
      const newUsers = globalUsersList.map(u => u.id === userToBan.id ? { ...u, status: 'Inactive' } : u);
      globalUsersList = newUsers;
      setLocalUsersList(newUsers);

      // Link to Pending Actions
      globalPendingActions = globalPendingActions.map(p =>
        p.username === userToBan.username && p.status !== 'Resolved' ? { ...p, status: 'Resolved' } : p
      );

      setUserToBan(null);
    }
  };

  const confirmUnbanUser = () => {
    if (userToUnban) {
      const newUsers = globalUsersList.map(u => u.id === userToUnban.id ? { ...u, status: 'Active' } : u);
      globalUsersList = newUsers;
      setLocalUsersList(newUsers);

      // Link to Pending Actions
      globalPendingActions = globalPendingActions.map(p =>
        p.username === userToUnban.username && p.status === 'Resolved' ? { ...p, status: 'Pending' } : p
      );

      setUserToUnban(null);
    }
  };

  const filteredUsers = localUsersList.filter(user => {
    const matchStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = dateFilter === 'All' || user.joinDate.includes(dateFilter);
    return matchStatus && matchSearch && matchDate;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const currentUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          User Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>จัดการรายชื่อผู้ใช้งานทั้งหมด</p>
      </div>

      <div className="filters-container" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div className="filter-group">
          <Filter size={16} color="#6b7280" />
          <label>ค้นหาชื่อผู้ใช้:</label>
          <input
            type="text"
            className="filter-select"
            placeholder="พิมพ์ชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
        <div className="filter-group">
          <label>สถานะ:</label>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">ทั้งหมด</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="filter-group">
          <label>เดือนที่สมัคร:</label>
          <select className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="All">ทั้งหมด</option>
            <option value="/01/">มกราคม</option>
            <option value="/03/">มีนาคม</option>
            <option value="/04/">เมษายน</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {currentUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <div className="user-avatar">
                <User size={36} />
              </div>
              <div className="user-info">
                <p><strong>ชื่อผู้ใช้ :</strong> {user.username}</p>
                <p><strong>email :</strong> {user.email}</p>
                <p><strong>เบอร์โทร:</strong> {user.phone}</p>
                <p><strong>วันที่สมัครสมาชิก :</strong> {user.joinDate}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>สถานะ</strong>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                </p>
              </div>
            </div>
            <div className="user-card-actions">
              <button className="btn-action-info" onClick={() => setUserToView(user)}>ดูข้อมูล</button>
              {user.status === 'Active' ? (
                <button className="btn-action-danger" onClick={() => handleBanUser(user)}>ระงับบัญชี</button>
              ) : (
                <button className="btn-action-success" onClick={() => handleUnbanUser(user)}>คืนสิทธิ์บัญชี</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          className="btn-cancel"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          style={{ opacity: safePage === 1 ? 0.5 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
        >
          ก่อนหน้า
        </button>
        <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>หน้า {safePage} จาก {totalPages}</span>
        <button
          className="btn-cancel"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          style={{ opacity: safePage === totalPages ? 0.5 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          ถัดไป
        </button>
      </div>

      {/* Ban User Confirmation Modal */}
      {userToBan && (
        <div className="modal-overlay" onClick={() => setUserToBan(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToBan(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Ban size={24} color="#ef4444" /> ยืนยันการระงับบัญชี
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชี <strong>{userToBan.username}</strong>?<br />
              การกระทำนี้จะทำให้ผู้ใช้ไม่สามารถล็อกอินหรือโพสต์ได้อีก
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setUserToBan(null)}>ยกเลิก</button>
              <button className="btn-action-danger" onClick={confirmBanUser}>
                ยืนยันการระงับบัญชี
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban User Confirmation Modal */}
      {userToUnban && (
        <div className="modal-overlay" onClick={() => setUserToUnban(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToUnban(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle size={24} color="#10b981" /> ยืนยันการคืนสิทธิ์บัญชี
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการคืนสิทธิ์การใช้งานให้บัญชี <strong>{userToUnban.username}</strong>?<br />
              ผู้ใช้จะสามารถล็อกอินและกลับมาใช้งานระบบได้ตามปกติ
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setUserToUnban(null)}>ยกเลิก</button>
              <button className="btn-action-success" onClick={confirmUnbanUser}>
                ยืนยันการคืนสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Info Deep Dive Modal */}
      {userToView && (
        <div className="modal-overlay" onClick={() => setUserToView(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToView(null)} />

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: '#d1d5db', borderRadius: '50%', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={50} color="#6b7280" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{userToView.username}</h2>
              <p style={{ color: '#4b5563', margin: '0 0 0.25rem 0' }}>อีเมล: {userToView.email} | เบอร์โทร: {userToView.phone}</p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>วันที่สมัคร: {userToView.joinDate} | สถานะ: {userToView.status}</p>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>🏠 ความพร้อมในการเลี้ยง (ประเมิน)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#374151' }}>
                <div><strong>ที่พักอาศัย:</strong> หอพัก/คอนโด (อนุญาตสัตว์เลี้ยง)</div>
                <div><strong>ขนาดพื้นที่:</strong> ปานกลาง</div>
                <div><strong>เวลาว่างต่อวัน:</strong> 4-6 ชั่วโมง</div>
                <div><strong>งบประมาณต่อเดือน:</strong> 3,000 - 5,000 บาท</div>
                <div><strong>ประสบการณ์:</strong> ระดับปานกลาง</div>
                <div><strong>เด็กเล็กในบ้าน:</strong> ไม่มี</div>
                <div><strong>สัตว์เลี้ยงอื่น:</strong> ไม่มี</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>🐾 โพสต์หาบ้าน (ที่ประกาศไว้)</h3>
              {globalCatsList.filter(c => c.poster === userToView.username).length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {globalCatsList.filter(c => c.poster === userToView.username).map(c => (
                    <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <img src={c.image} alt={c.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div>
                        <strong>{c.name}</strong> ({c.breed})<br />
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สถานะ: {c.status} | ลงเมื่อ: {c.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>ยังไม่มีโพสต์หาบ้าน</p>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>❤️ โพสต์ขอรับเลี้ยง (ที่ยื่นคำขอ)</h3>
              {globalCatsList.filter(c => c.id % 5 === userToView.id % 5 && c.poster !== userToView.username).length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {globalCatsList.filter(c => c.id % 5 === userToView.id % 5 && c.poster !== userToView.username).slice(0, 2).map(c => (
                    <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <img src={c.image} alt={c.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div>
                        <strong>{c.name}</strong> ({c.breed})<br />
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สถานะคำขอ: รอพิจารณา | ยื่นเมื่อ: เร็วๆ นี้</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>ยังไม่มีคำขอรับเลี้ยง</p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>🚨 รายการการโดนร้องเรียน</h3>
              {globalPendingActions.filter(p => p.username === userToView.username).length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {globalPendingActions.filter(p => p.username === userToView.username).map(p => (
                    <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ color: '#b91c1c' }}>ข้อหา: {p.issue}</strong><br />
                        <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>วันที่: {p.date}</span>
                      </div>
                      <span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#10b981' }}>ประวัติขาวสะอาด ไม่เคยถูกรายงาน</p>
              )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="btn-cancel" onClick={() => setUserToView(null)}>ปิดหน้าต่าง</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const EvaluationCriteria = () => {
  const [criteriaList, setCriteriaList] = useState(evaluationCriteriaData);
  const [isFormView, setIsFormView] = useState(false);
  const [topic, setTopic] = useState('');
  const [condition, setCondition] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [scoreRatio, setScoreRatio] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');

  const resetForm = () => {
    setEditingId(null);
    setTopic('');
    setCondition('');
    setMaxScore('');
    setScoreRatio('');
    setIsBlocking(false);
  };

  const handleSave = () => {
    if (!topic || !condition || maxScore === '' || scoreRatio === '') return;

    if (editingId) {
      setCriteriaList(criteriaList.map(item =>
        item.id === editingId
          ? {
            ...item,
            topic,
            condition,
            maxScore: Number(maxScore),
            scoreRatio: Number(scoreRatio),
            isBlocking,
            updated: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
          }
          : item
      ));
    } else {
      const newCriteria = {
        id: Date.now(),
        topic,
        condition,
        maxScore: Number(maxScore),
        scoreRatio: Number(scoreRatio),
        isBlocking: isBlocking,
        updated: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
        isActive: true
      };
      setCriteriaList([newCriteria, ...criteriaList]);
    }

    setIsFormView(false);
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTopic(item.topic);
    setCondition(item.condition);
    setMaxScore(String(item.maxScore));
    setScoreRatio(String(item.scoreRatio));
    setIsBlocking(item.isBlocking);
    setIsFormView(true);
  };

  const requestDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId !== null) {
      setCriteriaList(criteriaList.filter(item => item.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleCancel = () => {
    setIsFormView(false);
    resetForm();
  };

  const toggleStatus = (id) => {
    setCriteriaList(criteriaList.map(item =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCriteria = criteriaList.filter(item => {
    const matchSearch = item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTopic = topicFilter === 'All' || item.topic === topicFilter;
    return matchSearch && matchTopic;
  });

  const totalPages = Math.ceil(filteredCriteria.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const currentCriteria = filteredCriteria.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Evaluation Criteria
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>
            {isFormView ? 'แก้ไขเกณฑ์การประเมิน' : 'จัดการหัวข้อ เงื่อนไข และน้ำหนักสำหรับการคำนวณ Match Score'}
          </p>
        </div>
        {!isFormView && (
          <button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.25rem', borderRadius: '12px' }} onClick={() => setIsFormView(true)}>
            <Plus size={24} />
            เพิ่มเกณฑ์ใหม่
          </button>
        )}
      </div>

      {!isFormView && (
        <div className="filters-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-bar-container" style={{ flex: 1, minWidth: '300px', margin: 0 }}>
            <Search className="icon" size={20} style={{ marginRight: '8px', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="ค้นหาหัวข้อประเมิน หรือเงื่อนไข..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group" style={{ margin: 0 }}>
            <Filter size={16} color="#6b7280" />
            <label>เกณฑ์ประเมิน:</label>
            <select className="filter-select" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              <option value="All">ทั้งหมด</option>
              <option value="พื้นที่ในการเลี้ยง">พื้นที่ในการเลี้ยง</option>
              <option value="งบประมาณต่อเดือน">งบประมาณต่อเดือน</option>
              <option value="เวลาในการดูแล">เวลาในการดูแล</option>
              <option value="ประสบการณ์ในการเลี้ยง">ประสบการณ์ในการเลี้ยง</option>
            </select>
          </div>
        </div>
      )}

      {isFormView ? (
        <div className="eval-form-container">
          <div className="form-group">
            <label>หัวข้อประเมิน</label>
            <input
              type="text"
              placeholder="กรอกหัวข้อ"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>เงื่อนไข</label>
            <input
              type="text"
              placeholder="กรอกเงื่อนไข"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>คะแนนเต็ม (Max Score)</label>
            <input
              type="text"
              placeholder="กรอกคะแนนเต็ม เช่น 25"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>สัดส่วนคะแนน (Score Ratio 0.0 - 1.0)</label>
            <input
              type="text"
              placeholder="เช่น 1.0 หรือ 0.5"
              value={scoreRatio}
              onChange={(e) => setScoreRatio(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isBlocking"
              checked={isBlocking}
              onChange={(e) => setIsBlocking(e.target.checked)}
              style={{ width: '1.5rem', height: '1.5rem', margin: 0, boxShadow: 'none' }}
            />
            <label htmlFor="isBlocking" style={{ margin: 0, color: '#ef4444' }}>ตัดสิทธิ์ทันทีหากตรงเงื่อนไขนี้ (Is Blocking)</label>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCancel}>ยกเลิก</button>
            <button className="btn-save" onClick={handleSave}>บันทึก</button>
          </div>
        </div>
      ) : (
        <div className="table-container eval-table-container">
          <table className="eval-table">
            <thead>
              <tr>
                <th>หัวข้อประเมิน</th>
                <th>เงื่อนไข</th>
                <th>คะแนนที่ได้ (สัดส่วน)</th>
                <th>อัปเดตล่าสุด</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {currentCriteria.map((item) => (
                <tr key={item.id} className="eval-row" style={{ opacity: item.isActive ? 1 : 0.6, transition: 'opacity 0.3s' }}>
                  <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{item.topic}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.condition}</td>
                  <td style={{ fontWeight: 'bold', color: item.isBlocking ? '#ef4444' : 'var(--primary-dark)', fontSize: '1rem' }}>
                    {item.isBlocking
                      ? 'ตัดสิทธิ์ทันที'
                      : `${item.maxScore * item.scoreRatio} (${item.scoreRatio * 100}%)`}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.updated}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => toggleStatus(item.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <span
                      className="action-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '24px', fontSize: '1.125rem', cursor: 'pointer' }}
                      onClick={() => handleEdit(item)}
                    >
                      <Edit size={20} color="#f59e0b" /> แก้ไข
                    </span>
                    <span
                      className="action-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '1.125rem', cursor: 'pointer' }}
                      onClick={() => requestDelete(item.id)}
                    >
                      <Trash2 size={20} color="#ef4444" /> ลบ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem' }}>
            <button
              className="btn-cancel"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ opacity: safePage === 1 ? 0.5 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
            >
              ก่อนหน้า
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>หน้า {safePage} จาก {totalPages}</span>
            <button
              className="btn-cancel"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ opacity: safePage === totalPages ? 0.5 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={cancelDelete}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '1rem' }}>ยืนยันการลบ</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.125rem' }}>คุณแน่ใจหรือไม่ว่าต้องการลบเกณฑ์ประเมินนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn-cancel" onClick={cancelDelete} style={{ padding: '0.75rem 1.5rem' }}>ยกเลิก</button>
              <button className="btn-save" onClick={confirmDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>ลบเกณฑ์</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const breedsList = [
    'วิเชียรมาศ', 'ขาวมณี', 'เปอร์เซีย', 'สีสวาด',
    'สก็อตติช โฟลด์', 'อเมริกัน ช็อตแฮร์', 'ศุภลักษณ์',
    'แมวไทย', 'ไม่ทราบสายพันธุ์'
  ];

  const statusList = ['Active', 'Adopted'];

  const monthsList = [
    { label: 'มกราคม', value: '/01/' },
    { label: 'กุมภาพันธ์', value: '/02/' },
    { label: 'มีนาคม', value: '/03/' },
    { label: 'เมษายน', value: '/04/' }
  ];

  const [filter, setFilter] = useState('All'); // Pie chart filter
  const [breedFilter, setBreedFilter] = useState('ทั้งหมด'); // Dropdown filter
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [monthFilter, setMonthFilter] = useState('ทั้งหมด'); // Dropdown filter
  const [pendingFilter, setPendingFilter] = useState('ทั้งหมด'); // Pending Actions filter

  const [localPendingActions, setLocalPendingActions] = useState(globalPendingActions);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All'); // ComposedChart filter

  const handlePieClick = (data) => {
    if (filter === data.name) {
      setFilter('All');
    } else {
      setFilter(data.name);
    }
  };

  const handleBreedBarClick = (data) => {
    if (breedFilter === data.name) {
      setBreedFilter('ทั้งหมด');
    } else {
      setBreedFilter(data.name);
    }
  };

  const handleBarClick = (data) => {
    const fullNameMap = { 'ม.ค.': '/01/', 'ก.พ.': '/02/', 'มี.ค.': '/03/', 'เม.ย.': '/04/', 'พ.ค.': '/05/', 'มิ.ย.': '/06/' };
    const monthVal = fullNameMap[data.name];
    if (monthFilter === monthVal) {
      setMonthFilter('ทั้งหมด');
    } else {
      setMonthFilter(monthVal);
    }
  };

  const handleResolveReport = (action) => {
    if (selectedReport) {
      const newActions = globalPendingActions.map(item => item.id === selectedReport.id ? { ...item, status: 'Resolved' } : item);
      globalPendingActions = newActions;
      setLocalPendingActions(newActions);

      if (action === 'ban') {
        const newUsers = globalUsersList.map(u => u.username === selectedReport.username ? { ...u, status: 'Inactive' } : u);
        globalUsersList = newUsers;
      }

      setSelectedReport(null);
    }
  };

  const handleOpenReport = (item) => {
    setSelectedReport(item);
    if (item.status === 'Pending') {
      const newActions = globalPendingActions.map(p => p.id === item.id ? { ...p, status: 'Inspecting' } : p);
      globalPendingActions = newActions;
      setLocalPendingActions(newActions);
    }
  };

  const filteredPendingActions = localPendingActions.filter(item => {
    if (pendingFilter === 'ทั้งหมด') return true;
    return item.status === pendingFilter;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredPendingActions.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const currentPendingActions = filteredPendingActions.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // 1. Base Totals from mockData
  const BASE_TOTAL_CATS = statsData.totalCats;
  const BASE_TOTAL_USERS = statsData.totalUsers;
  const BASE_POSTERS = statsData.totalPosters;
  const BASE_ADOPTERS = statsData.totalAdopters;
  const BASE_ADOPTED = statsData.adoptedCats;
  const BASE_PENDING = statsData.findingHomeCats;

  // 2. Calculate Multipliers
  let mr = 1.0;
  const shortMonthMapRev = { '/01/': 'ม.ค.', '/02/': 'ก.พ.', '/03/': 'มี.ค.', '/04/': 'เม.ย.', '/05/': 'พ.ค.', '/06/': 'มิ.ย.' };
  let activeShortMonth = 'ทั้งหมด';

  if (monthFilter !== 'ทั้งหมด') {
    activeShortMonth = shortMonthMapRev[monthFilter] || monthFilter;
    const mData = monthlyAdoptionData.find(m => m.name === activeShortMonth);
    if (mData) {
      mr = mData.added / BASE_TOTAL_CATS;
    }
  }

  let br = 1.0;
  if (breedFilter !== 'ทั้งหมด') {
    const bData = catBreedsDataAll.find(b => b.name === breedFilter);
    if (bData) {
      br = bData.value / BASE_TOTAL_CATS;
    } else {
      br = 0.05; // Fallback for unmatched breeds
    }
  }

  let ur_cats = 1.0;
  if (filter === 'ผู้ลงประกาศ') ur_cats = 0.5;
  if (filter === 'ผู้ขอรับเลี้ยง') ur_cats = 0.5;

  let sr_adopted = 1.0;
  let sr_pending = 1.0;
  if (statusFilter === 'Active') { sr_adopted = 0; sr_pending = 1.0; }
  else if (statusFilter === 'Adopted') { sr_adopted = 1.0; sr_pending = 0; }

  // 3. Compute dynamic statsData (Perfect Sums)
  let dynamicAdopted = Math.round(BASE_ADOPTED * mr * br * ur_cats * sr_adopted);
  let dynamicPending = Math.round(BASE_PENDING * mr * br * ur_cats * sr_pending);
  let dynamicCats = dynamicAdopted + dynamicPending;

  let dynamicPosters = Math.round(BASE_POSTERS * mr * br);
  let dynamicAdopters = Math.round(BASE_ADOPTERS * mr * br);

  if (filter === 'ผู้ลงประกาศ') dynamicAdopters = 0;
  if (filter === 'ผู้ขอรับเลี้ยง') dynamicPosters = 0;

  let dynamicUsers = dynamicPosters + dynamicAdopters;

  const dynamicStatsData = {
    totalUsers: dynamicUsers.toLocaleString(),
    totalPosters: dynamicPosters.toLocaleString(),
    totalAdopters: dynamicAdopters.toLocaleString(),
    totalCats: dynamicCats.toLocaleString(),
    adoptedCats: dynamicAdopted.toLocaleString(),
    findingHomeCats: dynamicPending.toLocaleString()
  };

  // 4. Compute dynamic monthly graph (Main Chart)
  let filteredMonthlyData = monthlyAdoptionData.map(item => {
    let ad = Math.round(item.adopted * br * ur_cats * sr_adopted);
    let pd = Math.round((item.added - item.adopted) * br * ur_cats * sr_pending);
    return {
      name: item.name,
      added: ad + pd,
      adopted: ad,
      pending: pd
    };
  });
  if (activeShortMonth !== 'ทั้งหมด') {
    filteredMonthlyData = filteredMonthlyData.filter(item => item.name === activeShortMonth);
  }

  // 5. Compute dynamic Donut Graph (User Types)
  let activeUserTypesData = [
    { name: 'ผู้ลงประกาศ', value: dynamicPosters },
    { name: 'ผู้ขอรับเลี้ยง', value: dynamicAdopters }
  ];
  if (filter !== 'All') {
    activeUserTypesData = activeUserTypesData.map(u =>
      u.name === filter ? u : { ...u, value: 0 }
    );
  }

  // 6. Compute dynamic Bar Chart (Cat Breeds)
  const baseBreeds = filter === 'ผู้ลงประกาศ' ? catBreedsDataPosters : filter === 'ผู้ขอรับเลี้ยง' ? catBreedsDataAdopters : catBreedsDataAll;
  let activeCatBreedsData = baseBreeds.map(item => {
    let activeVal = (BASE_PENDING / BASE_TOTAL_CATS) * item.value * mr;
    let adoptedVal = (BASE_ADOPTED / BASE_TOTAL_CATS) * item.value * mr;
    let finalVal = item.value * mr;
    if (statusFilter === 'Active') finalVal = activeVal;
    else if (statusFilter === 'Adopted') finalVal = adoptedVal;
    return {
      name: item.name,
      value: Math.round(finalVal)
    };
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Data Visualization
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>ภาพรวมสถิติการรับเลี้ยงแมว</p>
        </div>
      </div>

      {/* Statistics Section */}
      <h3 className="section-title">Statistics Overview</h3>
      <div className="stats-grid">
        <StatCard icon={Users} title="จำนวนผู้ใช้ทั้งหมด" value={dynamicStatsData.totalUsers} unit="บัญชี" color="#4f46e5" />
        <StatCard icon={FileText} title="จำนวนผู้ประกาศ" value={dynamicStatsData.totalPosters} unit="บัญชี" color="#0284c7" />
        <StatCard icon={UserPlus} title="จำนวนผู้ขอรับเลี้ยง" value={dynamicStatsData.totalAdopters} unit="บัญชี" color="#0d9488" />
        <StatCard icon={Cat} title="จำนวนแมวทั้งหมด" value={dynamicStatsData.totalCats} unit="ตัว" color="#ea580c" />
        <StatCard icon={Heart} title="ได้บ้านแล้ว" value={dynamicStatsData.adoptedCats} unit="ตัว" color="#e11d48" />
        <StatCard icon={Home} title="กำลังหาบ้าน" value={dynamicStatsData.findingHomeCats} unit="ตัว" color="#16a34a" />
      </div>

      {/* Data Visualization Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Data Visualization</h3>

        <div className="filters-container" style={{ marginBottom: 0 }}>
          <div className="filter-group">
            <Filter size={16} color="#6b7280" />
            <label>สายพันธุ์:</label>
            <select className="filter-select" value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
              <option value="ทั้งหมด">ทั้งหมด</option>
              {breedsList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>สถานะ:</label>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ทั้งหมด">ทั้งหมด</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>ช่วงเวลา:</label>
            <select className="filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="ทั้งหมด">ทั้งหมด</option>
              {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="charts-layout">

        {/* Main Composed Chart */}
        <div className="chart-card">
          <h4 className="chart-title">
            สถิติการรับเลี้ยงรายเดือน
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginTop: '4px', fontWeight: 'normal' }}>
              (คลิกที่แท่งกราฟเดือนที่ต้องการ เพื่อกรองข้อมูลกราฟด้านล่าง)
            </span>
          </h4>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={filteredMonthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#fdf2f8' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', color: '#374151' }} />

                <Bar name="จำนวนแมวที่เข้าสู่ระบบ (ตัว)" dataKey="added" radius={[4, 4, 0, 0]} barSize={40} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                  {filteredMonthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="#fca5a5"
                      opacity={activeShortMonth === 'ทั้งหมด' || activeShortMonth === entry.name ? 0.8 : 0.3}
                    />
                  ))}
                  <LabelList dataKey="added" position="top" fill="#fca5a5" fontSize={13} fontWeight={600} />
                </Bar>

                <Line name="จำนวนแมวที่ได้บ้าน (ตัว)" type="monotone" dataKey="adopted" stroke="#f87171" strokeWidth={4} dot={{ r: 5, fill: '#f87171', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }}>
                  <LabelList dataKey="adopted" position="top" offset={10} fill="#f87171" fontSize={14} fontWeight={600} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="small-charts">
          {/* Donut Chart */}
          <div className="chart-card">
            <h4 className="chart-title">
              สัดส่วนประเภทผู้ใช้งาน
              {activeShortMonth !== 'ทั้งหมด' ? (
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginTop: '4px', fontWeight: 'normal' }}>
                  (เฉพาะเดือน: {activeShortMonth})
                </span>
              ) : (
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#8b5cf6', marginTop: '4px', fontWeight: 'normal' }}>
                  (คลิกที่กราฟเพื่อกรองข้อมูลสายพันธุ์)
                </span>
              )}
            </h4>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={activeUserTypesData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    onClick={handlePieClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {activeUserTypesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={filter === 'All' || filter === entry.name ? 1 : 0.3}
                      />
                    ))}
                    <Label
                      value={`${dynamicUsers.toLocaleString()} คน`}
                      position="center"
                      fill="#374151"
                      style={{ fontSize: '1.5rem', fontWeight: '700' }}
                    />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="chart-card">
            <h4 className="chart-title">
              จำนวนแมวตามสายพันธุ์ยอดฮิต
              {filter !== 'All' && (
                <span style={{ color: '#8b5cf6', marginLeft: '8px' }}>
                  (เฉพาะกลุ่ม: {filter})
                </span>
              )}
              {activeShortMonth !== 'ทั้งหมด' && (
                <span style={{ color: '#f87171', marginLeft: '8px' }}>
                  [เดือน: {activeShortMonth}]
                </span>
              )}
            </h4>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={activeCatBreedsData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <Tooltip cursor={{ fill: '#fdf2f8' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                  <Bar name="จำนวน (ตัว)" dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} onClick={handleBreedBarClick} style={{ cursor: 'pointer' }}>
                    {activeCatBreedsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#8b5cf6"
                        opacity={breedFilter === 'ทั้งหมด' || breedFilter === entry.name ? 1 : 0.3}
                      />
                    ))}
                    <LabelList dataKey="value" position="top" fill="#8b5cf6" fontSize={13} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Pending Actions Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Pending Actions</h3>
        <div className="filter-group">
          <label>สถานะการตรวจสอบ:</label>
          <select className="filter-select" value={pendingFilter} onChange={(e) => setPendingFilter(e.target.value)}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="Pending">Pending</option>
            <option value="Inspecting">Inspecting</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Date</th>
              <th>Issue</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentPendingActions.map((item) => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td>{item.date}</td>
                <td>{item.issue}</td>
                <td>
                  <span className={`badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === 'Pending' && (
                    <span className="action-link" onClick={() => handleOpenReport(item)}>เริ่มตรวจสอบ</span>
                  )}
                  {item.status === 'Inspecting' && (
                    <span className="action-link" style={{ color: '#2563eb', fontWeight: '500' }} onClick={() => handleOpenReport(item)}>ตรวจสอบต่อ</span>
                  )}
                  {item.status === 'Resolved' && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>ดำเนินการแล้ว</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem' }}>
          <button
            className="btn-cancel"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{ opacity: safePage === 1 ? 0.5 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
          >
            ก่อนหน้า
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>หน้า {safePage} จาก {totalPages}</span>
          <button
            className="btn-cancel"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{ opacity: safePage === totalPages ? 0.5 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            ถัดไป
          </button>
        </div>
      </div>

      {/* Report Inspection Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setSelectedReport(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="#ef4444" /> ตรวจสอบรายงาน
            </h3>

            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>ผู้ถูกรายงาน:</strong> {selectedReport.username}
                <a href="#" onClick={(e) => { e.preventDefault(); alert(`กำลังเปิดหน้าโปรไฟล์/โพสต์ของ ${selectedReport.username} (Mock)`); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                  <ExternalLink size={14} /> ดูโพสต์ต้นฉบับ
                </a>
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>วันที่:</strong> {selectedReport.date}</p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>หัวข้อที่ละเมิด:</strong> {selectedReport.issue}</p>
              <p style={{ margin: 0, color: '#4b5563' }}><strong>รายละเอียด:</strong> ผู้ใช้รายนี้มีการกระทำที่ขัดต่อกฎของชุมชน โปรดตรวจสอบหลักฐานและดำเนินการตามความเหมาะสม</p>
            </div>

            {/* Evidence Preview */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '0.95rem' }}>หลักฐาน / โพสต์ที่ถูกรายงาน:</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <img
                  src={
                    selectedReport.id % 3 === 0
                      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80'
                      : selectedReport.id % 3 === 1
                        ? 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=150&q=80'
                        : 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=150&q=80'
                  }
                  alt="Report evidence"
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #f3f4f6' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', color: '#1f2937' }}>
                    {selectedReport.issue === 'รูปภาพไม่เหมาะสม' ? 'รูปภาพโปรไฟล์/รูปแมว มีความไม่เหมาะสม' :
                      selectedReport.issue === 'ขายของผิดประเภท' ? 'โพสต์ขายสินค้าที่ไม่เกี่ยวข้อง' :
                        'โพสต์หาบ้านให้แมว (มีพฤติกรรมน่าสงสัย)'}
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6b7280' }}>เนื้อหาของ {selectedReport.username} ถูกรายงานเมื่อ {selectedReport.date}</p>
                  <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '0.85rem' }}>
                    <strong>ข้อสังเกต:</strong> อาจเข้าข่าย {selectedReport.issue}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-success" onClick={() => handleResolveReport('ignore')}>
                <CheckCircle size={20} /> ไม่พบความผิด
              </button>
              <button className="btn-danger" onClick={() => handleResolveReport('ban')}>
                <Ban size={20} /> ระงับบัญชีผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

// --- Main App ---

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin1' && password === '12345') {
      setError('');
      onLogin();
    } else {
      setError('Username หรือ Password ไม่ถูกต้อง');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', backgroundImage: 'linear-gradient(135deg, #ffe4e6 0%, #e0e7ff 100%)' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '450px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#fca5a5', borderRadius: '50%', marginBottom: '1rem', color: 'white' }}>
            <Cat size={48} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>Admin Portal</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Pet Adoption Management System</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
              Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้..."
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.875rem 3rem 0.875rem 1rem', borderRadius: '12px', border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '1rem', backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.125rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.4)' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cat size={28} />
          <h2 style={{ margin: 0, fontWeight: 600 }}>Pet Adoption Admin</h2>
        </div>
        <div className="nav-icons" style={{ gap: '0.5rem' }}>
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
          >
            <LayoutGrid size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
            title="Evaluation Criteria"
          >
            <ClipboardList size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            title="Users"
          >
            <User size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'cats' ? 'active' : ''}`}
            onClick={() => setActiveTab('cats')}
            title="Cats"
          >
            <Cat size={24} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">

        {activeTab === 'evaluation' ? (
          <EvaluationCriteria />
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'cats' ? (
          <CatManagement />
        ) : activeTab === 'cats' ? (
          <CatManagement />
        ) : (
          <Dashboard />
        )}

      </main>
    </div>
  );
}

export default App;
