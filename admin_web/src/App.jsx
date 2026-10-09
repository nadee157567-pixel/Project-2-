import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, FileText, Cat, Home, Heart,
  MoreVertical, Menu, LayoutGrid, FileSpreadsheet, Download, Filter, ClipboardList, Trash2, Edit, Plus, User, Search, Settings2, X, AlertCircle, Ban, XCircle, CheckCircle, ExternalLink, Eye, EyeOff, LogOut, Loader2, RefreshCw, MessageSquare, Camera, Image, ChevronDown, Bell, AlertTriangle, ShieldAlert, Check, RotateCcw, Lock
} from 'lucide-react';
import { io } from 'socket.io-client';
import html2canvas from 'html2canvas';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LabelList, Label
} from 'recharts';
import { statsData, monthlyAdoptionData, userTypesData, catBreedsDataAll, catBreedsDataPosters, catBreedsDataAdopters, pendingActionsData, evaluationCriteriaData, usersListData, catsListData, thaiMonths } from './mockData';
import { adminApi, clearAuthSession, getStoredUser } from './api';
import './index.css';

let globalPendingActions = [...pendingActionsData];
let globalUsersList = [...usersListData];
let globalCatsList = [...catsListData];

// --- Audio Notification Synthesizer ---
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) { }
};

// --- Components ---

const StatCard = ({ icon: Icon, title, value, unit, color, onClick }) => (
  <div
    className="stat-card"
    onClick={onClick}
    style={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    title={onClick ? `คลิกเพื่อดูรายละเอียดในหน้าจัดการ: ${title}` : undefined}
  >
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

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('10.0.2.2')) return url.replace('10.0.2.2', 'localhost');
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
};

const CAT_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1529778459854-e85294575333?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?auto=format&fit=crop&w=400&q=80',
];

const getFallbackCatImage = (idKey) => {
  if (!idKey) return CAT_PLACEHOLDER_IMAGES[0];
  let num = 0;
  if (typeof idKey === 'number') {
    num = idKey;
  } else if (typeof idKey === 'string') {
    for (let i = 0; i < idKey.length; i++) {
      num += idKey.charCodeAt(i);
    }
  }
  return CAT_PLACEHOLDER_IMAGES[Math.abs(num) % CAT_PLACEHOLDER_IMAGES.length];
};

const getScoreColor = (scoreReceived, maxScoreVal = 25, isBlocking = false) => {
  if (isBlocking) return '#ef4444';
  const score = Number(scoreReceived || 0);
  const max = Number(maxScoreVal || 25);
  const ratio = max > 0 ? score / max : 0;
  if (score === 0 || ratio < 0.4) return '#ef4444'; // Red for low or 0
  if (ratio < 0.8) return '#d97706'; // Yellow/Orange for medium
  return '#059669'; // Green for high/full
};

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container" style={{
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      padding: '1rem 0.5rem',
      marginTop: '1.25rem',
      borderTop: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <span>
          แสดง <strong>{startItem} - {endItem}</strong> จากทั้งหมด <strong>{totalItems}</strong> รายการ
        </span>
        {onItemsPerPageChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>แสดงหน้าละ:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value={6}>6 รายการ</option>
              <option value={9}>9 รายการ</option>
              <option value={12}>12 รายการ</option>
              <option value={24}>24 รายการ</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: currentPage <= 1 ? '#f3f4f6' : '#ffffff',
            color: currentPage <= 1 ? '#9ca3af' : '#374151',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.15s ease'
          }}
        >
          ‹ ก่อนหน้า
        </button>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '8px',
                border: page === currentPage ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: page === currentPage ? '#3b82f6' : '#ffffff',
                color: page === currentPage ? '#ffffff' : '#4b5563',
                fontWeight: page === currentPage ? '600' : 'normal',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: currentPage >= totalPages ? '#f3f4f6' : '#ffffff',
            color: currentPage >= totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.15s ease'
          }}
        >
          ถัดไป ›
        </button>
      </div>
    </div>
  );
};

const CatManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [appliedBreeds, setAppliedBreeds] = useState([]);
  const [appliedStatuses, setAppliedStatuses] = useState([]);
  const [appliedMonths, setAppliedMonths] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const breedsList = [
    'วิเชียรมาศ', 'ขาวมณี', 'เปอร์เซีย', 'สีสวาด',
    'สก็อตติช โฟลด์', 'อเมริกัน ช็อตแฮร์', 'ศุภลักษณ์',
    'แมวไทย', 'ไม่ทราบสายพันธุ์'
  ];

  const statusList = ['Active', 'Adopted'];

  const monthsList = thaiMonths;

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

  const [localCatsList, setLocalCatsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catToHide, setCatToHide] = useState(null);
  const [catToUnhide, setCatToUnhide] = useState(null);
  const [catToDelete, setCatToDelete] = useState(null);
  const [catToView, setCatToView] = useState(null);

  const [catApplications, setCatApplications] = useState([]);
  const [catAppsLoading, setCatAppsLoading] = useState(false);

  const [userToView, setUserToView] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCatApplications = async (catId) => {
    setCatAppsLoading(true);
    try {
      const res = await adminApi.getApplications();
      if (res && res.success && Array.isArray(res.data)) {
        const catApps = res.data.filter(app => Number(app.cat_id) === Number(catId));
        setCatApplications(catApps);
      } else {
        setCatApplications([]);
      }
    } catch (err) {
      console.error('Fetch cat applications error:', err);
      setCatApplications([]);
    } finally {
      setCatAppsLoading(false);
    }
  };

  const handleOpenCatDetail = (cat) => {
    setCatToView(cat);
    fetchCatApplications(cat.id);
  };

  const handleOpenUserDetail = async (userId) => {
    setUserToView({ id: userId });
    setUserDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminApi.getUserDetail(userId);
      if (res && res.success && res.data) {
        setUserDetail(res.data);
      }
    } catch (err) {
      console.error('Fetch user detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCats();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(cat => ({
          id: cat.cat_id,
          name: cat.pet_name || 'ไม่ระบุชื่อ',
          breed: cat.pet_breed || 'ไม่ระบุสายพันธุ์',
          poster: cat.poster_name || cat.poster_username || 'ไม่ระบุ',
          date: cat.created_at ? new Date(cat.created_at).toLocaleDateString('th-TH') : '-',
          status: cat.is_hidden ? 'Hidden' : (cat.status === 'adopted' ? 'Adopted' : 'Active'),
          ageCategory: cat.age_months ? `${cat.age_months} เดือน` : 'ไม่ระบุ',
          image: formatImageUrl(cat.image_url) || getFallbackCatImage(cat.cat_id || cat.pet_name),
          raw: cat
        }));
        setLocalCatsList(mapped);
      }
    } catch (err) {
      console.error('Fetch cats error:', err);
      setLocalCatsList(globalCatsList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleHideCat = (cat) => {
    setCatToHide(cat);
  };

  const handleUnhideCat = (cat) => {
    setCatToUnhide(cat);
  };

  const confirmHideCat = async () => {
    if (catToHide) {
      try {
        await adminApi.hideCat(catToHide.id);
        await fetchCats();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการซ่อนประกาศ: ' + err.message);
      }
      setCatToHide(null);
    }
  };

  const confirmUnhideCat = async () => {
    if (catToUnhide) {
      try {
        await adminApi.unhideCat(catToUnhide.id);
        await fetchCats();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการยกเลิกซ่อน: ' + err.message);
      }
      setCatToUnhide(null);
    }
  };

  const handleDeleteCat = (cat) => {
    setCatToDelete(cat);
  };

  const confirmDeleteCat = async () => {
    if (catToDelete) {
      try {
        await adminApi.deleteCat(catToDelete.id);
        await fetchCats();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบประกาศ: ' + err.message);
      }
      setCatToDelete(null);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedBreeds, appliedStatuses, appliedMonths]);

  const paginatedCats = filteredCats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Cat Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>จัดการประกาศหาบ้านให้แมว</p>
      </div>

      <div className="search-bar-container">
        <Search className="icon" size={20} style={{ marginRight: '8px' }} />
        <input
          type="text"
          placeholder="ค้นหาจากชื่อ, สายพันธุ์..."
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
        {paginatedCats.map((cat) => (
          <div key={cat.id} className="cat-card">
            <div className="cat-card-content">
              <img
                src={cat.image}
                alt={cat.name}
                className="cat-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getFallbackCatImage(cat.id || cat.name);
                }}
              />
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
              <button className="btn-action-info btn-sm" onClick={() => handleOpenCatDetail(cat)}>ดูรายละเอียด</button>
              {cat.status === 'Hidden' ? (
                <button className="btn-action-success btn-sm" onClick={() => handleUnhideCat(cat)}>ยกเลิกซ่อน</button>
              ) : (
                <button className="btn-action-danger btn-sm" onClick={() => handleHideCat(cat)}>ซ่อน</button>
              )}
              <button className="btn-action-danger btn-sm" style={{ backgroundColor: '#b91c1c' }} onClick={() => handleDeleteCat(cat)}>ลบ</button>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredCats.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {isFilterOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterOpen(false)}>
          <div className="modal-content filter-modal-content" onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setIsFilterOpen(false)} />

            <div className="filter-modal-header">
              <Filter size={22} color="#ec4899" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#1f2937' }}>
                ตัวกรองค้นหาประกาศแมว
              </h3>
            </div>

            <div className="filter-sections-scroll">
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

                  <div className="filter-heading" style={{ marginTop: '1.25rem' }}>เดือนที่ลงประกาศ</div>
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
            </div>

            <div className="filter-modal-footer">
              <button className="btn-filter-reset" onClick={handleClearFilter}>ล้างตัวกรอง</button>
              <button className="btn-filter-apply" onClick={handleApplyFilter}>นำตัวกรองไปใช้</button>
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

      {/* Delete Cat Confirmation Modal */}
      {catToDelete && (
        <div className="modal-overlay" onClick={() => setCatToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setCatToDelete(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Trash2 size={24} color="#dc2626" /> ยืนยันการลบประกาศถาวร
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบประกาศ <strong>{catToDelete.name}</strong> ออกจากระบบถาวร?<br />
              <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>⚠️ การลบจะล้างข้อมูลรูปภาพและประวัติที่เกี่ยวข้องทั้งหมด และไม่สามารถกู้คืนได้</span>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setCatToDelete(null)}>ยกเลิก</button>
              <button className="btn-action-danger" style={{ backgroundColor: '#dc2626' }} onClick={confirmDeleteCat}>
                ยืนยันการลบถาวร
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
              <img
                src={catToView.image}
                alt={catToView.name}
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', margin: '0 auto 1rem auto', display: 'block', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getFallbackCatImage(catToView.id || catToView.name);
                }}
              />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{catToView.name} ({catToView.breed})</h2>
              <p style={{ color: '#4b5563', margin: '0 0 0.25rem 0' }}>โพสต์โดย: <strong>{catToView.poster}</strong></p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>วันที่ลงประกาศ: {catToView.date} | สถานะ: <span className={`status-badge ${catToView.status.toLowerCase()}`}>{catToView.status}</span></p>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', color: '#374151' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>เพศ:</strong> {catToView.raw?.gender === 'male' ? 'เพศผู้' : (catToView.raw?.gender === 'female' ? 'เพศเมีย' : (catToView.id % 2 === 0 ? 'เพศผู้' : 'เพศเมีย'))}</div>
                <div><strong>อายุ:</strong> {catToView.raw?.age_months ? `${catToView.raw.age_months} เดือน` : catToView.ageCategory}</div>
                <div><strong>สายพันธุ์:</strong> {catToView.breed}</div>
                <div><strong>เคยรับวัคซีนแล้ว:</strong> {catToView.raw?.is_vaccinated || 'ฉีดแล้ว'}</div>
                <div><strong>ทำหมันแล้ว:</strong> {catToView.raw?.is_sterilized || 'ทำแล้ว'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>ลักษณะนิสัย:</strong> {catToView.raw?.personality || 'เข้ากับแมวและคนได้ดี'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>สุขภาพ:</strong> {catToView.raw?.health_note || 'แข็งแรงดี สมบูรณ์'}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', color: '#374151' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>🎯 เงื่อนไขความพร้อมที่ต้องการ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div><strong>พื้นที่ที่ต้องการ:</strong> {catToView.raw?.req_space_level === 'small' ? 'พื้นที่ขนาดเล็ก (คอนโด/หอพัก)' : catToView.raw?.req_space_level === 'medium' ? 'พื้นที่ขนาดกลาง (ทาวน์โฮม)' : 'พื้นที่ขนาดใหญ่ (บ้านเดี่ยวมีรั้ว)'}</div>
                <div><strong>เวลาที่ต้องให้:</strong> {catToView.raw?.req_attention === 'high' ? 'ต้องการเวลาดูแลมาก (3+ ชม./วัน)' : catToView.raw?.req_attention === 'medium' ? 'ต้องการเวลาดูแลปานกลาง (1-2 ชม./วัน)' : 'ต้องการเวลาดูแลปกติ'}</div>
                <div><strong>ค่าใช้จ่ายโดยประมาณ:</strong> {catToView.raw?.est_monthly_cost ? `${Number(catToView.raw.est_monthly_cost).toLocaleString()} บาท/เดือน` : '3,000 บาท/เดือน'}</div>
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
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💌 คำขอรับเลี้ยง ({catApplications.length} รายการ)
              </h3>
              {catAppsLoading ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                  <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 0.5rem auto' }} />
                  <span style={{ fontSize: '0.9rem' }}>กำลังโหลดคำขอรับเลี้ยง...</span>
                </div>
              ) : catApplications.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {catApplications.map(app => (
                    <li key={app.match_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={20} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#1f2937' }}>
                            {app.applicant_name || app.applicant_username}
                          </strong>
                          {app.applicant_username && app.applicant_name && app.applicant_name !== app.applicant_username && (
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '6px' }}>
                              (@{app.applicant_username})
                            </span>
                          )}
                          <br />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                              ความพร้อม: <strong>{app.matchscore}%</strong> ({Number(app.matchscore) >= 70 ? 'ผ่านเกณฑ์' : 'ต่ำกว่าเกณฑ์'})
                            </span>
                            <span className={`status-badge ${app.status}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              {app.status === 'approved' ? 'อนุมัติแล้ว' : app.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        onClick={() => handleOpenUserDetail(app.applicant_id)}
                        style={{ fontSize: '0.85rem', color: '#2563eb', cursor: 'pointer', fontWeight: '600', backgroundColor: '#eff6ff', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}
                      >
                        ดูโปรไฟล์
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, padding: '0.5rem 0' }}>ยังไม่มีผู้ยื่นคำขอรับเลี้ยงแมวตัวนี้</p>
              )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="btn-cancel" onClick={() => setCatToView(null)}>ปิดหน้าต่าง</button>
            </div>

          </div>
        </div>
      )}

      {/* User Profile Modal when clicking ดูโปรไฟล์ */}
      {userToView && (
        <div className="modal-overlay" onClick={() => setUserToView(null)}>
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToView(null)} />

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem auto' }} />
                <p style={{ fontSize: '1.1rem' }}>กำลังโหลดข้อมูลผู้ใช้เชิงลึก...</p>
              </div>
            ) : userDetail ? (
              <div>
                {/* Header profile */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#e0e7ff', borderRadius: '50%', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <User size={44} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                    {userDetail.fullname || userDetail.username}
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>
                    @{userDetail.username} | {userDetail.email}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>📞 {userDetail.phonenumber || '-'}</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Line: {userDetail.line_id || '-'}</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สมัครเมื่อ: {userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('th-TH') : '-'}</span>
                    <span className={`status-badge ${userDetail.is_banned ? 'inactive' : 'active'}`}>
                      {userDetail.is_banned ? 'ระงับการใช้งาน' : 'ใช้งานปกติ (Active)'}
                    </span>
                  </div>

                  {/* Banned Alert if active */}
                  {userDetail.is_banned === 1 && (
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.6rem 1rem', marginTop: '0.75rem', color: '#991b1b', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <Ban size={18} color="#dc2626" />
                      <div>
                        <strong>บัญชีนี้ถูกระงับการใช้งาน</strong>: {userDetail.ban_reason || 'แอดมินระงับการใช้งาน'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Activity Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fce7f3', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9d174d' }}>โพสต์หาบ้าน</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#be185d' }}>{userDetail.stats?.total_posted_cats || 0} ตัว</div>
                  </div>
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>ยื่นขอรับเลี้ยง</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>{userDetail.stats?.total_applications_sent || 0} ครั้ง</div>
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534' }}>รับเลี้ยงสำเร็จ</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d' }}>{userDetail.stats?.total_applications_approved || 0} ตัว</div>
                  </div>
                  <div style={{ backgroundColor: '#faf5ff', border: '1px solid #f3e8ff', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b21a8' }}>แบบประเมิน</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7e22ce' }}>{userDetail.stats?.total_assessments || 0} ครั้ง</div>
                  </div>
                </div>

                {/* 1. Home Profile */}
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={18} color="#3b82f6" /> ข้อมูลความพร้อมในการเลี้ยง (ประเมินบ้าน)
                  </h3>
                  {userDetail.profile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                      <div><strong>ที่พักอาศัย:</strong> {userDetail.profile.living_space_type || 'ไม่ระบุ'}</div>
                      <div><strong>ขนาดพื้นที่:</strong> {userDetail.profile.space_size ? `${userDetail.profile.space_size} ตร.ม.` : 'ไม่ระบุ'}</div>
                      <div><strong>เวลาว่างต่อวัน:</strong> {userDetail.profile.daily_free_hours ? `${userDetail.profile.daily_free_hours} ชม./วัน` : 'ไม่ระบุ'}</div>
                      <div><strong>งบประมาณต่อเดือน:</strong> {userDetail.profile.max_monthly_budget ? `${Number(userDetail.profile.max_monthly_budget).toLocaleString()} บาท` : 'ไม่ระบุ'}</div>
                      <div><strong>ประสบการณ์เลี้ยง:</strong> {userDetail.profile.experience || 'ไม่ระบุ'}</div>
                      <div><strong>เด็กเล็กในบ้าน:</strong> {userDetail.profile.has_children ? 'มีเด็กเล็ก' : 'ไม่มีเด็กเล็ก'}</div>
                      <div><strong>สัตว์เลี้ยงอื่น:</strong> {userDetail.profile.has_other_pets ? 'มีสัตว์เลี้ยงอื่น' : 'ไม่มีสัตว์เลี้ยงอื่น'}</div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ผู้ใช้ยังไม่ได้กรอกแบบฟอร์มข้อมูลความพร้อมที่พักอาศัย (user_profiles)</p>
                  )}
                </div>

                {/* 2. Cats Posted */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cat size={18} color="#ec4899" /> โพสต์หาบ้านที่ประกาศไว้ ({userDetail.posted_cats?.length || 0} รายการ)
                  </h3>
                  {userDetail.posted_cats && userDetail.posted_cats.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {userDetail.posted_cats.map(c => (
                        <div key={c.cat_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={c.image_url ? (c.image_url.startsWith('http') ? c.image_url : `http://localhost:3000${c.image_url}`) : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80'}
                              alt={c.pet_name}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{c.pet_name}</strong> ({c.pet_breed})<br />
                              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>ลงเมื่อ: {c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${c.status === 'adopted' ? 'adopted' : 'active'}`} style={{ fontSize: '0.75rem' }}>
                              {c.status === 'adopted' ? 'รับเลี้ยงแล้ว' : 'หาบ้าน'}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>{c.applications_count || 0} คำขอ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ยังไม่มีโพสต์หาบ้าน</p>
                  )}
                </div>

                {/* 3. Adoption Applications Sent */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={18} color="#f43f5e" /> คำขอรับเลี้ยงที่ยื่นหาแมวตัวอื่น ({userDetail.applications_sent?.length || 0} รายการ)
                  </h3>
                  {userDetail.applications_sent && userDetail.applications_sent.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {userDetail.applications_sent.map(app => (
                        <div key={app.match_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={app.cat_image ? (app.cat_image.startsWith('http') ? app.cat_image : `http://localhost:3000${app.cat_image}`) : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80'}
                              alt={app.pet_name}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{app.pet_name}</strong> ({app.pet_breed})<br />
                              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>เจ้าของ: {app.poster_name || app.poster_username} | ยื่นเมื่อ: {app.applied_at ? new Date(app.applied_at).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${app.status}`} style={{ fontSize: '0.75rem' }}>
                              {app.status === 'pending' ? 'รอพิจารณา' :
                                app.status === 'interview' ? 'สัมภาษณ์' :
                                  app.status === 'approved' ? 'อนุมัติแล้ว' :
                                    app.status === 'rejected' ? 'ปฏิเสธ' : app.status}
                            </span>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
                              {app.matchscore ? `${Number(app.matchscore).toFixed(0)}%` : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ยังไม่มีประวัติการยื่นคำขอรับเลี้ยง</p>
                  )}
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button className="btn-cancel" onClick={() => setUserToView(null)}>ปิดหน้าต่างโปรไฟล์</button>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#ef4444', padding: '2rem' }}>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const UserManagement = ({ initialRoleFilter = 'all' }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [userTypeFilter, setUserTypeFilter] = useState(
    initialRoleFilter === 'poster' ? 'Poster' : initialRoleFilter === 'adopter' ? 'Adopter' : 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [localUsersList, setLocalUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [userToUnban, setUserToUnban] = useState(null);
  const [userToView, setUserToView] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banReason, setBanReason] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    if (initialRoleFilter === 'poster') setUserTypeFilter('Poster');
    else if (initialRoleFilter === 'adopter') setUserTypeFilter('Adopter');
    else if (initialRoleFilter === 'all') setUserTypeFilter('All');
  }, [initialRoleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data
          .filter(u => u.role === 'user')
          .map(u => ({
            id: u.user_id,
            username: u.username,
            fullname: u.fullname || u.username,
            email: u.email,
            phone: u.phonenumber || '-',
            joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-',
            status: u.is_banned ? 'Inactive' : 'Active',
            role: u.role,
            ban_reason: u.ban_reason,
            posted_count: u.posted_count || 0,
            app_count: u.app_count || 0,
            raw: u
          }));
        setLocalUsersList(mapped);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setLocalUsersList(globalUsersList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUserDetail = async (user) => {
    setUserToView(user);
    setUserDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminApi.getUserDetail(user.id);
      if (res.success && res.data) {
        setUserDetail(res.data);
      }
    } catch (err) {
      console.error('Fetch user detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBanUser = (user) => {
    setUserToBan(user);
    setBanReason('');
  };

  const handleUnbanUser = (user) => {
    setUserToUnban(user);
  };

  const confirmBanUser = async () => {
    if (userToBan) {
      try {
        await adminApi.toggleUserBan(userToBan.id, true, banReason);
        await fetchUsers();
        if (userDetail && userDetail.user_id === userToBan.id) {
          setUserDetail({ ...userDetail, is_banned: 1, ban_reason: banReason });
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการระงับผู้ใช้: ' + err.message);
      }
      setUserToBan(null);
      setBanReason('');
    }
  };

  const confirmUnbanUser = async () => {
    if (userToUnban) {
      try {
        await adminApi.toggleUserBan(userToUnban.id, false);
        await fetchUsers();
        if (userDetail && userDetail.user_id === userToUnban.id) {
          setUserDetail({ ...userDetail, is_banned: 0, ban_reason: null });
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการปลดระงับผู้ใช้: ' + err.message);
      }
      setUserToUnban(null);
    }
  };

  const filteredUsers = localUsersList.filter(user => {
    const isUserRole = user.role === 'user';
    const matchStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchUserType = userTypeFilter === 'All' ||
      (userTypeFilter === 'Poster' && user.posted_count > 0) ||
      (userTypeFilter === 'Adopter' && user.app_count > 0);
    const matchSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullname && user.fullname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDate = dateFilter === 'All' || (() => {
      let mNum = null;
      if (user.raw && user.raw.created_at) {
        mNum = new Date(user.raw.created_at).getMonth() + 1;
      } else if (user.joinDate) {
        const parts = user.joinDate.split('/');
        if (parts.length > 1) mNum = parseInt(parts[1], 10);
      }
      const filterNum = parseInt(dateFilter.replace(/\//g, ''), 10);
      return mNum !== null && mNum === filterNum;
    })();
    return isUserRole && matchStatus && matchUserType && matchSearch && matchDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, userTypeFilter, dateFilter]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          User Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>จัดการรายชื่อผู้ใช้งาน</p>
      </div>

      <div className="filters-container" style={{ marginBottom: '2rem', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div className="filter-group">
          <Filter size={16} color="#6b7280" />
          <label>ค้นหาชื่อผู้ใช้:</label>
          <input
            type="text"
            className="filter-select"
            placeholder="กรอกชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
        <div className="filter-group">
          <label>ประเภทผู้ใช้:</label>
          <select className="filter-select" value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}>
            <option value="All">ทั้งหมด</option>
            <option value="Poster">ผู้ประกาศ (Poster)</option>
            <option value="Adopter">ผู้ขอรับเลี้ยง (Adopter)</option>
          </select>
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
            <option value="/02/">กุมภาพันธ์</option>
            <option value="/03/">มีนาคม</option>
            <option value="/04/">เมษายน</option>
            <option value="/05/">พฤษภาคม</option>
            <option value="/06/">มิถุนายน</option>
            <option value="/07/">กรกฎาคม</option>
            <option value="/08/">สิงหาคม</option>
            <option value="/09/">กันยายน</option>
            <option value="/10/">ตุลาคม</option>
            <option value="/11/">พฤศจิกายน</option>
            <option value="/12/">ธันวาคม</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {paginatedUsers.map((user) => (
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
              <button className="btn-action-info" onClick={() => handleOpenUserDetail(user)}>ดูข้อมูล</button>
              {user.status === 'Active' ? (
                <button className="btn-action-danger" onClick={() => handleBanUser(user)}>ระงับบัญชี</button>
              ) : (
                <button className="btn-action-success" onClick={() => handleUnbanUser(user)}>คืนสิทธิ์บัญชี</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Ban User Confirmation Modal */}
      {userToBan && (
        <div className="modal-overlay" onClick={() => setUserToBan(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToBan(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Ban size={24} color="#ef4444" /> ยืนยันการระงับบัญชี
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชี <strong>{userToBan.username}</strong>?<br />
              การกระทำนี้จะทำให้ผู้ใช้ไม่สามารถล็อกอินหรือโพสต์ได้อีก
            </p>
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                ระบุเหตุผลในการระงับบัญชี (บันทึก Audit Log):
              </label>
              <input
                type="text"
                placeholder="เช่น โพสต์หลอกลวง, ทำผิดกฎชุมชน..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
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
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setUserToView(null)} />

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem auto' }} />
                <p style={{ fontSize: '1.1rem' }}>กำลังโหลดข้อมูลผู้ใช้เชิงลึก...</p>
              </div>
            ) : userDetail ? (
              <div>
                {/* Header profile */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#e0e7ff', borderRadius: '50%', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <User size={44} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                    {userDetail.fullname || userDetail.username}
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>
                    @{userDetail.username} | {userDetail.email}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>📞 {userDetail.phonenumber || '-'}</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Line: {userDetail.line_id || '-'}</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>สมัครเมื่อ: {userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('th-TH') : '-'}</span>
                    <span className={`status-badge ${userDetail.is_banned ? 'inactive' : 'active'}`}>
                      {userDetail.is_banned ? 'ระงับการใช้งาน' : 'ใช้งานปกติ (Active)'}
                    </span>
                  </div>

                  {/* Banned Alert if active */}
                  {userDetail.is_banned === 1 && (
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.6rem 1rem', marginTop: '0.75rem', color: '#991b1b', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <Ban size={18} color="#dc2626" />
                      <div>
                        <strong>บัญชีนี้ถูกระงับการใช้งาน</strong>: {userDetail.ban_reason || 'แอดมินระงับการใช้งาน'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Activity Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fce7f3', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9d174d' }}>โพสต์หาบ้าน</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#be185d' }}>{userDetail.stats?.total_posted_cats || 0} ตัว</div>
                  </div>
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>ยื่นขอรับเลี้ยง</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>{userDetail.stats?.total_applications_sent || 0} ครั้ง</div>
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534' }}>รับเลี้ยงสำเร็จ</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d' }}>{userDetail.stats?.total_applications_approved || 0} ตัว</div>
                  </div>
                  <div style={{ backgroundColor: '#faf5ff', border: '1px solid #f3e8ff', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b21a8' }}>แบบประเมิน</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7e22ce' }}>{userDetail.stats?.total_assessments || 0} ครั้ง</div>
                  </div>
                </div>

                {/* 1. Home Profile */}
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={18} color="#3b82f6" /> ข้อมูลความพร้อมในการเลี้ยง (ประเมินบ้าน)
                  </h3>
                  {userDetail.profile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                      <div><strong>ที่พักอาศัย:</strong> {userDetail.profile.living_space_type || 'ไม่ระบุ'}</div>
                      <div><strong>ขนาดพื้นที่:</strong> {userDetail.profile.space_size ? `${userDetail.profile.space_size} ตร.ม.` : 'ไม่ระบุ'}</div>
                      <div><strong>เวลาว่างต่อวัน:</strong> {userDetail.profile.daily_free_hours ? `${userDetail.profile.daily_free_hours} ชม./วัน` : 'ไม่ระบุ'}</div>
                      <div><strong>งบประมาณต่อเดือน:</strong> {userDetail.profile.max_monthly_budget ? `${Number(userDetail.profile.max_monthly_budget).toLocaleString()} บาท` : 'ไม่ระบุ'}</div>
                      <div><strong>ประสบการณ์เลี้ยง:</strong> {userDetail.profile.experience || 'ไม่ระบุ'}</div>
                      <div><strong>เด็กเล็กในบ้าน:</strong> {userDetail.profile.has_children ? 'มีเด็กเล็ก' : 'ไม่มีเด็กเล็ก'}</div>
                      <div><strong>สัตว์เลี้ยงอื่น:</strong> {userDetail.profile.has_other_pets ? 'มีสัตว์เลี้ยงอื่น' : 'ไม่มีสัตว์เลี้ยงอื่น'}</div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ผู้ใช้ยังไม่ได้กรอกแบบฟอร์มข้อมูลความพร้อมที่พักอาศัย (user_profiles)</p>
                  )}
                </div>

                {/* 2. Cats Posted */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cat size={18} color="#ec4899" /> โพสต์หาบ้านที่ประกาศไว้ ({userDetail.posted_cats?.length || 0} รายการ)
                  </h3>
                  {userDetail.posted_cats && userDetail.posted_cats.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {userDetail.posted_cats.map(c => (
                        <div key={c.cat_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={c.image_url ? (c.image_url.startsWith('http') ? c.image_url : `http://localhost:3000${c.image_url}`) : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80'}
                              alt={c.pet_name}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{c.pet_name}</strong> ({c.pet_breed})<br />
                              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>ลงเมื่อ: {c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${c.status === 'adopted' ? 'adopted' : 'active'}`} style={{ fontSize: '0.75rem' }}>
                              {c.status === 'adopted' ? 'รับเลี้ยงแล้ว' : 'หาบ้าน'}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>{c.applications_count || 0} คำขอ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ยังไม่มีโพสต์หาบ้าน</p>
                  )}
                </div>

                {/* 3. Adoption Applications Sent */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={18} color="#f43f5e" /> คำขอรับเลี้ยงที่ยื่นหาแมวตัวอื่น ({userDetail.applications_sent?.length || 0} รายการ)
                  </h3>
                  {userDetail.applications_sent && userDetail.applications_sent.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {userDetail.applications_sent.map(app => (
                        <div key={app.match_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={app.cat_image ? (app.cat_image.startsWith('http') ? app.cat_image : `http://localhost:3000${app.cat_image}`) : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80'}
                              alt={app.pet_name}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{app.pet_name}</strong> ({app.pet_breed})<br />
                              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>เจ้าของ: {app.poster_name || app.poster_username} | ยื่นเมื่อ: {app.applied_at ? new Date(app.applied_at).toLocaleDateString('th-TH') : '-'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${app.status}`} style={{ fontSize: '0.75rem' }}>
                              {app.status === 'pending' ? 'รอพิจารณา' :
                                app.status === 'interview' ? 'สัมภาษณ์' :
                                  app.status === 'approved' ? 'อนุมัติแล้ว' :
                                    app.status === 'rejected' ? 'ปฏิเสธ' : app.status}
                            </span>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
                              {app.matchscore ? `${Number(app.matchscore).toFixed(0)}%` : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ยังไม่มีประวัติการยื่นคำขอรับเลี้ยง</p>
                  )}
                </div>

                {/* 4. Assessments History */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClipboardList size={18} color="#8b5cf6" /> ประวัติการทำแบบประเมินบ้าน ({userDetail.assessments?.length || 0} รายการ)
                  </h3>
                  {userDetail.assessments && userDetail.assessments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {userDetail.assessments.map(item => (
                        <div key={item.assessment_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>ประเมินกับ {item.pet_name} ({item.pet_breed})</strong><br />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>เมื่อ: {item.assessed_at ? new Date(item.assessed_at).toLocaleDateString('th-TH') : '-'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge success" style={{ fontSize: '0.75rem' }}>{item.suitability_level}</span>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2563eb', marginTop: '2px' }}>
                              {item.match_percentage ? `${Number(item.match_percentage).toFixed(0)}%` : `${item.total_score} คะแนน`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>ยังไม่มีประวัติการทำแบบประเมิน</p>
                  )}
                </div>

                {/* Action footer */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <div>
                    {userDetail.is_banned ? (
                      <button className="btn-action-success btn-sm" onClick={() => { setUserToView(null); handleUnbanUser(userDetail); }}>
                        คืนสิทธิ์บัญชีนี้
                      </button>
                    ) : (
                      <button className="btn-action-danger btn-sm" onClick={() => { setUserToView(null); handleBanUser(userDetail); }}>
                        ระงับบัญชีนี้
                      </button>
                    )}
                  </div>
                  <button className="btn-cancel" onClick={() => setUserToView(null)}>ปิดหน้าต่าง</button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
};

const EvaluationCriteria = () => {
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormView, setIsFormView] = useState(false);
  const PRESET_CONDITIONS = [
    'equal_or_higher',
    'lower_one_level',
    'lower_two_levels',
    'ratio_gte_1',
    'ratio_080_099',
    'ratio_060_079',
    'ratio_lt_060'
  ];

  const [topic, setTopic] = useState('');
  const [condition, setCondition] = useState('');
  const [isCustomCondition, setIsCustomCondition] = useState(false);
  const [customConditionInput, setCustomConditionInput] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [scoreRatio, setScoreRatio] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCriteria();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(item => ({
          id: item.criteria_id,
          topic: item.criteria_name || item.profile_field || 'เกณฑ์การประเมิน',
          condition: item.condition_value,
          maxScore: Number(item.max_score || 0),
          scoreRatio: Number(item.score_ratio || 0),
          isBlocking: Boolean(item.is_blocking),
          isActive: Boolean(item.is_active),
          updated: item.updated ? new Date(item.updated).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-',
          field: item.profile_field,
          raw: item
        }));
        setCriteriaList(mapped);
      }
    } catch (err) {
      console.error('Fetch criteria error:', err);
      setCriteriaList(evaluationCriteriaData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTopic('');
    setCondition('');
    setIsCustomCondition(false);
    setCustomConditionInput('');
    setMaxScore('');
    setScoreRatio('');
    setIsBlocking(false);
  };

  const handleSave = async () => {
    if (!topic || !condition || maxScore === '' || scoreRatio === '') return;
    try {
      const payload = {
        profile_field: topic,
        condition_value: condition,
        max_score: Number(maxScore),
        score_ratio: Number(scoreRatio),
        is_blocking: isBlocking ? 1 : 0
      };
      if (editingId) {
        await adminApi.updateCriteria(editingId, payload);
      } else {
        await adminApi.createCriteria(payload);
      }
      await fetchCriteria();
      setIsFormView(false);
      resetForm();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกเกณฑ์: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTopic(item.field || item.topic);
    setCondition(item.condition);
    setMaxScore(String(item.maxScore));
    setScoreRatio(String(item.scoreRatio));
    setIsBlocking(item.isBlocking);
    setIsFormView(true);
  };

  const requestDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId !== null) {
      try {
        await adminApi.deleteCriteria(deleteConfirmId);
        await fetchCriteria();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบเกณฑ์: ' + err.message);
      }
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
            <select
              value={isCustomCondition ? 'other' : condition}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'other') {
                  setIsCustomCondition(true);
                  setCondition(customConditionInput);
                } else {
                  setIsCustomCondition(false);
                  setCondition(val);
                }
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">เลือกเงื่อนไข</option>
              <option value="equal_or_higher">equal_or_higher</option>
              <option value="lower_one_level">lower_one_level</option>
              <option value="lower_two_levels">lower_two_levels</option>
              <option value="ratio_gte_1">ratio_gte_1</option>
              <option value="ratio_080_099">ratio_080_099</option>
              <option value="ratio_060_079">ratio_060_079</option>
              <option value="ratio_lt_060">ratio_lt_060</option>
              <option value="other">อื่นๆ (ระบุเงื่อนไขเอง)</option>
            </select>
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
              {criteriaList.map((item) => (
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

const Dashboard = ({ onNavigate }) => {
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
    { label: 'เมษายน', value: '/04/' },
    { label: 'พฤษภาคม', value: '/05/' },
    { label: 'มิถุนายน', value: '/06/' },
    { label: 'กรกฎาคม', value: '/07/' },
    { label: 'สิงหาคม', value: '/08/' },
    { label: 'กันยายน', value: '/09/' },
    { label: 'ตุลาคม', value: '/10/' },
    { label: 'พฤศจิกายน', value: '/11/' },
    { label: 'ธันวาคม', value: '/12/' }
  ];

  const [filter, setFilter] = useState('All'); // Pie chart filter
  const [breedFilter, setBreedFilter] = useState('ทั้งหมด'); // Dropdown filter
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [monthFilter, setMonthFilter] = useState('ทั้งหมด'); // Dropdown filter
  const [pendingFilter, setPendingFilter] = useState('ทั้งหมด'); // Pending Actions filter
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [pendingItemsPerPage, setPendingItemsPerPage] = useState(6);

  const [localPendingActions, setLocalPendingActions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All'); // ComposedChart filter
  const [stats, setStats] = useState(null);
  const [latestActivities, setLatestActivities] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, actRes, repRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getActivity(),
          adminApi.getReports()
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.data);
        }
        if (actRes.status === 'fulfilled' && actRes.value?.success && Array.isArray(actRes.value.data)) {
          setLatestActivities(actRes.value.data);
        }
        if (repRes.status === 'fulfilled' && repRes.value?.success && Array.isArray(repRes.value.reports)) {
          setLocalPendingActions(repRes.value.reports);
        } else {
          setLocalPendingActions(globalPendingActions);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };
    loadDashboard();

    const handleNewReportEvent = (e) => {
      const newReport = e.detail;
      if (!newReport) return;
      setLocalPendingActions(prev => {
        const exists = prev.some(r => r.id === newReport.id || r.report_id === newReport.id);
        if (exists) return prev;
        return [newReport, ...prev];
      });
    };

    const handleOpenReportEvent = (e) => {
      const rep = e.detail;
      if (rep) {
        setSelectedReport(rep);
      }
    };

    window.addEventListener('report:new', handleNewReportEvent);
    window.addEventListener('report:open', handleOpenReportEvent);

    return () => {
      window.removeEventListener('report:new', handleNewReportEvent);
      window.removeEventListener('report:open', handleOpenReportEvent);
    };
  }, []);

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
    const fullNameMap = {
      'ม.ค.': '/01/', 'มกราคม': '/01/',
      'ก.พ.': '/02/', 'กุมภาพันธ์': '/02/',
      'มี.ค.': '/03/', 'มีนาคม': '/03/',
      'เม.ย.': '/04/', 'เมษายน': '/04/',
      'พ.ค.': '/05/', 'พฤษภาคม': '/05/',
      'มิ.ย.': '/06/', 'มิถุนายน': '/06/',
      'ก.ค.': '/07/', 'กรกฎาคม': '/07/',
      'ส.ค.': '/08/', 'สิงหาคม': '/08/',
      'ก.ย.': '/09/', 'กันยายน': '/09/',
      'ต.ค.': '/10/', 'ตุลาคม': '/10/',
      'พ.ย.': '/11/', 'พฤศจิกายน': '/11/',
      'ธ.ค.': '/12/', 'ธันวาคม': '/12/'
    };
    const monthVal = fullNameMap[data.name];
    if (monthFilter === monthVal) {
      setMonthFilter('ทั้งหมด');
    } else {
      setMonthFilter(monthVal || 'ทั้งหมด');
    }
  };

  const [confirmResolveAction, setConfirmResolveAction] = useState(null); // 'ignore' or 'ban'
  const [resolveLoading, setResolveLoading] = useState(false);

  const handleResolveReport = async (action) => {
    if (!selectedReport) return;
    setResolveLoading(true);
    try {
      const reasonNote = action === 'ban'
        ? `ระงับบัญชีผู้ใช้เนื่องจากพบการกระทำผิด (${selectedReport.issue || 'รายงานความผิด'})`
        : 'ตรวจสอบแล้วไม่พบความผิดร้ายแรง';
      await adminApi.updateReportStatus(selectedReport.id, action, reasonNote);
      const nowStr = new Date().toLocaleDateString('th-TH');
      setLocalPendingActions(prev => prev.map(item => item.id === selectedReport.id ? {
        ...item,
        status: 'Resolved',
        admin_note: reasonNote,
        handled_by: 'แอดมิน',
        handled_at: nowStr
      } : item));
      setSelectedReport(null);
      setConfirmResolveAction(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกผล: ' + err.message);
    } finally {
      setResolveLoading(false);
    }
  };

  const handleOpenReport = async (item) => {
    setSelectedReport(item);
    if (item.status === 'Pending') {
      try {
        await adminApi.updateReportStatus(item.id, 'inspect');
        setLocalPendingActions(prev => prev.map(p => p.id === item.id ? { ...p, status: 'Inspecting' } : p));
      } catch (err) {
        console.error('Error starting inspection on report:', err);
      }
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [downloadingChartId, setDownloadingChartId] = useState(null);
  const [isChartExportMenuOpen, setIsChartExportMenuOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.export-all-charts-dropdown')) {
        setIsChartExportMenuOpen(false);
      }
    };
    if (isChartExportMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isChartExportMenuOpen]);

  const handleExport = async (format = 'excel', type = 'all') => {
    try {
      setIsExporting(true);
      await adminApi.downloadReport({ format, type });
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดรายงาน: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadChartImage = async (elementId, chartTitle = 'chart') => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('ไม่พบส่วนของกราฟที่ต้องการดาวน์โหลด');
      return;
    }
    try {
      setDownloadingChartId(elementId);
      // Wait a moment for any active interaction/hover states to settle
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(element, {
        scale: 2, // 2x High-DPI crisp export
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList && (
          el.classList.contains('chart-download-btn') ||
          el.classList.contains('chart-export-group') ||
          el.classList.contains('chart-export-btn')
        )
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeTitle = chartTitle.replace(/[^a-zA-Z0-9\u0E00-\u0E7F_-]/g, '_');
      const filename = `${safeTitle}_${dateStr}.png`;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 1000);
    } catch (err) {
      console.error('Error downloading chart image:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดภาพกราฟ: ' + err.message);
    } finally {
      setDownloadingChartId(null);
    }
  };



  const filteredPendingActions = localPendingActions.filter(item => {
    if (pendingFilter === 'ทั้งหมด') return true;
    return item.status === pendingFilter;
  });

  // 1. Live Base Totals from backend API (fallback to mockData if loading/empty)
  const BASE_TOTAL_CATS = stats ? stats.totalCats : statsData.totalCats;
  const BASE_TOTAL_USERS = stats ? stats.totalUsers : statsData.totalUsers;
  const BASE_POSTERS = stats ? (stats.totalPosters !== undefined ? stats.totalPosters : statsData.totalPosters) : statsData.totalPosters;
  const BASE_ADOPTERS = stats ? (stats.totalAdopters !== undefined ? stats.totalAdopters : statsData.totalAdopters) : statsData.totalAdopters;
  const BASE_ADOPTED = stats ? (stats.adoptedCats !== undefined ? stats.adoptedCats : statsData.adoptedCats) : statsData.adoptedCats;
  const BASE_PENDING = stats ? (stats.findingHomeCats !== undefined ? stats.findingHomeCats : statsData.findingHomeCats) : statsData.findingHomeCats;

  // --- Cross-Chart Linking & Dynamic Multi-Filtering Logic ---
  const thaiMonthsList = [
    { key: '01', value: '/01/', name: 'มกราคม', short: 'ม.ค.' },
    { key: '02', value: '/02/', name: 'กุมภาพันธ์', short: 'ก.พ.' },
    { key: '03', value: '/03/', name: 'มีนาคม', short: 'มี.ค.' },
    { key: '04', value: '/04/', name: 'เมษายน', short: 'เม.ย.' },
    { key: '05', value: '/05/', name: 'พฤษภาคม', short: 'พ.ค.' },
    { key: '06', value: '/06/', name: 'มิถุนายน', short: 'มิ.ย.' },
    { key: '07', value: '/07/', name: 'กรกฎาคม', short: 'ก.ค.' },
    { key: '08', value: '/08/', name: 'สิงหาคม', short: 'ส.ค.' },
    { key: '09', value: '/09/', name: 'กันยายน', short: 'ก.ย.' },
    { key: '10', value: '/10/', name: 'ตุลาคม', short: 'ต.ค.' },
    { key: '11', value: '/11/', name: 'พฤศจิกายน', short: 'พ.ย.' },
    { key: '12', value: '/12/', name: 'ธันวาคม', short: 'ธ.ค.' }
  ];

  const monthNameMap = {
    '/01/': 'มกราคม', '/02/': 'กุมภาพันธ์', '/03/': 'มีนาคม', '/04/': 'เมษายน',
    '/05/': 'พฤษภาคม', '/06/': 'มิถุนายน', '/07/': 'กรกฎาคม', '/08/': 'สิงหาคม',
    '/09/': 'กันยายน', '/10/': 'ตุลาคม', '/11/': 'พฤศจิกายน', '/12/': 'ธันวาคม'
  };

  const selectedMonthKey = monthFilter !== 'ทั้งหมด' ? monthFilter.replace(/\//g, '') : null;
  const activeShortMonth = monthFilter !== 'ทั้งหมด' ? (monthNameMap[monthFilter] || monthFilter) : 'ทั้งหมด';

  const rawCats = (stats && Array.isArray(stats.rawCats)) ? stats.rawCats : [];
  const rawApps = (stats && Array.isArray(stats.rawApps)) ? stats.rawApps : [];
  const rawMonthlyData = (stats && Array.isArray(stats.monthlyTrends) && stats.monthlyTrends.length > 0)
    ? stats.monthlyTrends
    : monthlyAdoptionData;

  // 1. Monthly Chart Data (Cross-filtered by breedFilter and filter [User Type])
  let filteredMonthlyData = thaiMonthsList.map(m => {
    let added = 0;
    let adopted = 0;

    if (rawCats.length > 0 || rawApps.length > 0) {
      let mCats = rawCats.filter(c => c.created_month === m.key);
      let mApps = rawApps.filter(a => a.applied_month === m.key && a.status === 'approved');

      if (breedFilter !== 'ทั้งหมด') {
        mCats = mCats.filter(c => c.pet_breed === breedFilter);
        mApps = mApps.filter(a => a.pet_breed === breedFilter);
      }

      if (filter === 'ผู้ลงประกาศ') {
        mApps = [];
      } else if (filter === 'ผู้ขอรับเลี้ยง') {
        mCats = [];
      }

      added = mCats.length;
      adopted = statusFilter === 'Active' ? 0 : mApps.length;
    } else {
      const found = rawMonthlyData.find(d => d.name === m.name || d.short === m.short);
      added = found ? found.added : 0;
      adopted = statusFilter === 'Active' ? 0 : (found ? found.adopted : 0);
    }

    return {
      name: m.name,
      short: m.short,
      added,
      adopted
    };
  });

  if (monthFilter !== 'ทั้งหมด' && activeShortMonth !== 'ทั้งหมด') {
    filteredMonthlyData = filteredMonthlyData.filter(item => item.name === activeShortMonth || item.short === activeShortMonth);
  }

  // 2. User Types Chart Data (Cross-filtered by monthFilter and breedFilter)
  let activePostersCount = BASE_POSTERS;
  let activeAdoptersCount = BASE_ADOPTERS;

  if (rawCats.length > 0 || rawApps.length > 0) {
    let pCats = rawCats;
    let aApps = rawApps;

    if (selectedMonthKey) {
      pCats = pCats.filter(c => c.created_month === selectedMonthKey);
      aApps = aApps.filter(a => a.applied_month === selectedMonthKey);
    }
    if (breedFilter !== 'ทั้งหมด') {
      pCats = pCats.filter(c => c.pet_breed === breedFilter);
      aApps = aApps.filter(a => a.pet_breed === breedFilter);
    }

    activePostersCount = new Set(pCats.map(c => c.poster_id)).size;
    activeAdoptersCount = new Set(aApps.map(a => a.applicant_id)).size;
  }

  let activeUserTypesData = [
    { name: 'ผู้ลงประกาศ', value: activePostersCount },
    { name: 'ผู้ขอรับเลี้ยง', value: activeAdoptersCount }
  ];

  if (filter !== 'All') {
    activeUserTypesData = activeUserTypesData.map(u =>
      u.name === filter ? u : { ...u, value: 0 }
    );
  }

  // 3. Cat Breeds Chart Data (Cross-filtered by monthFilter and filter [User Type])
  let activeCatBreedsData = [];

  if (rawCats.length > 0 || rawApps.length > 0) {
    const bMap = {};

    if (filter === 'ผู้ขอรับเลี้ยง') {
      let targetApps = rawApps;
      if (selectedMonthKey) targetApps = targetApps.filter(a => a.applied_month === selectedMonthKey);
      if (statusFilter === 'Adopted') targetApps = targetApps.filter(a => a.status === 'approved');
      else if (statusFilter === 'Active') targetApps = targetApps.filter(a => a.status === 'pending');

      targetApps.forEach(a => {
        const b = a.pet_breed || 'ไม่ทราบสายพันธุ์';
        bMap[b] = (bMap[b] || 0) + 1;
      });
    } else {
      let targetCats = rawCats;
      if (selectedMonthKey) targetCats = targetCats.filter(c => c.created_month === selectedMonthKey);
      if (statusFilter === 'Active') targetCats = targetCats.filter(c => c.status !== 'adopted');
      else if (statusFilter === 'Adopted') targetCats = targetCats.filter(c => c.status === 'adopted');

      targetCats.forEach(c => {
        const b = c.pet_breed || 'ไม่ทราบสายพันธุ์';
        bMap[b] = (bMap[b] || 0) + 1;
      });
    }

    activeCatBreedsData = Object.keys(bMap).map(b => ({
      name: b,
      value: bMap[b]
    })).sort((a, b) => b.value - a.value);

    if (activeCatBreedsData.length === 0) {
      activeCatBreedsData = breedsList.map(b => ({ name: b, value: 0 }));
    }
  } else {
    const rawCatBreedsData = (stats && stats.catBreeds && stats.catBreeds.all && stats.catBreeds.all.length > 0)
      ? (filter === 'ผู้ลงประกาศ' ? stats.catBreeds.posters : filter === 'ผู้ขอรับเลี้ยง' ? stats.catBreeds.adopters : stats.catBreeds.all)
      : (filter === 'ผู้ลงประกาศ' ? catBreedsDataPosters : filter === 'ผู้ขอรับเลี้ยง' ? catBreedsDataAdopters : catBreedsDataAll);

    activeCatBreedsData = rawCatBreedsData.map(item => ({
      name: item.name,
      value: statusFilter === 'Adopted' ? (item.adopted !== undefined ? item.adopted : item.value) : statusFilter === 'Active' ? (item.available !== undefined ? item.available : item.value) : item.value
    }));
  }

  // Dynamic Stat Cards
  let dynamicPosters = activePostersCount;
  let dynamicAdopters = activeAdoptersCount;
  let dynamicUsers = BASE_TOTAL_USERS;

  if (filter === 'ผู้ลงประกาศ') {
    dynamicAdopters = 0;
    dynamicUsers = dynamicPosters;
  } else if (filter === 'ผู้ขอรับเลี้ยง') {
    dynamicPosters = 0;
    dynamicUsers = dynamicAdopters;
  }

  let dynamicAdopted = rawCats.length > 0 ? rawCats.filter(c => (selectedMonthKey ? c.created_month === selectedMonthKey : true) && (breedFilter !== 'ทั้งหมด' ? c.pet_breed === breedFilter : true) && c.status === 'adopted').length : BASE_ADOPTED;
  let dynamicPending = rawCats.length > 0 ? rawCats.filter(c => (selectedMonthKey ? c.created_month === selectedMonthKey : true) && (breedFilter !== 'ทั้งหมด' ? c.pet_breed === breedFilter : true) && c.status !== 'adopted').length : BASE_PENDING;

  if (statusFilter === 'Active') { dynamicAdopted = 0; }
  else if (statusFilter === 'Adopted') { dynamicPending = 0; }
  let dynamicCats = dynamicAdopted + dynamicPending;

  const dynamicStatsData = {
    totalUsers: dynamicUsers.toLocaleString(),
    totalPosters: dynamicPosters.toLocaleString(),
    totalAdopters: dynamicAdopters.toLocaleString(),
    totalCats: dynamicCats.toLocaleString(),
    adoptedCats: dynamicAdopted.toLocaleString(),
    findingHomeCats: dynamicPending.toLocaleString()
  };

  // 4. Monthly Chart Data (using real backend data)
  let filteredMonthlyData = rawMonthlyData.map(item => ({
    name: item.name,
    added: item.added,
    adopted: statusFilter === 'Active' ? 0 : item.adopted,
    pending: statusFilter === 'Adopted' ? 0 : (item.pending !== undefined ? item.pending : Math.max(0, item.added - item.adopted))
  }));

  const monthNameMap = {
    '/01/': 'มกราคม', '/02/': 'กุมภาพันธ์', '/03/': 'มีนาคม', '/04/': 'เมษายน',
    '/05/': 'พฤษภาคม', '/06/': 'มิถุนายน', '/07/': 'กรกฎาคม', '/08/': 'สิงหาคม',
    '/09/': 'กันยายน', '/10/': 'ตุลาคม', '/11/': 'พฤศจิกายน', '/12/': 'ธันวาคม'
  };
  const activeShortMonth = monthFilter !== 'ทั้งหมด' ? (monthNameMap[monthFilter] || monthFilter) : 'ทั้งหมด';
  const targetMonthName = monthNameMap[monthFilter];
  if (monthFilter !== 'ทั้งหมด' && targetMonthName) {
    filteredMonthlyData = filteredMonthlyData.filter(item => item.name === targetMonthName || item.short === targetMonthName);
  }

  // 5. Donut Chart Data (User Types)
  let activeUserTypesData = rawUserTypesData;
  if (filter !== 'All') {
    activeUserTypesData = activeUserTypesData.map(u =>
      u.name === filter ? u : { ...u, value: 0 }
    );
  }

  // 6. Bar Chart Data (Cat Breeds)
  let activeCatBreedsData = rawCatBreedsData.map(item => ({
    name: item.name,
    value: statusFilter === 'Adopted' ? (item.adopted !== undefined ? item.adopted : item.value) : statusFilter === 'Active' ? (item.available !== undefined ? item.available : item.value) : item.value
  }));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Data Visualization
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>ภาพรวมสถิติการรับเลี้ยงแมว</p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport('excel', 'all')}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: '500',
              fontSize: '0.9rem',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              opacity: isExporting ? 0.7 : 1
            }}
            title="ดาวน์โหลดสรุปสถิติทั้งหมดเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'กำลังส่งออก...' : 'Export Excel (.xlsx)'}
          </button>

          <button
            onClick={() => handleExport('csv', 'summary')}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: '500',
              fontSize: '0.9rem',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              opacity: isExporting ? 0.7 : 1
            }}
            title="ดาวน์โหลดสรุปสถิติเป็นไฟล์ CSV"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <h3 className="section-title">Statistics Overview</h3>
      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="จำนวนผู้ใช้ทั้งหมด"
          value={dynamicStatsData.totalUsers}
          unit="บัญชี"
          color="#4f46e5"
          onClick={() => onNavigate && onNavigate('users', 'role', 'all')}
        />
        <StatCard
          icon={FileText}
          title="จำนวนผู้ประกาศ"
          value={dynamicStatsData.totalPosters}
          unit="บัญชี"
          color="#0284c7"
          onClick={() => onNavigate && onNavigate('users', 'role', 'poster')}
        />
        <StatCard
          icon={UserPlus}
          title="จำนวนผู้ขอรับเลี้ยง"
          value={dynamicStatsData.totalAdopters}
          unit="บัญชี"
          color="#0d9488"
          onClick={() => onNavigate && onNavigate('users', 'role', 'adopter')}
        />
        <StatCard
          icon={Cat}
          title="จำนวนแมวทั้งหมด"
          value={dynamicStatsData.totalCats}
          unit="ตัว"
          color="#ea580c"
          onClick={() => onNavigate && onNavigate('cats', 'status', 'all')}
        />
        <StatCard
          icon={Heart}
          title="ได้บ้านแล้ว"
          value={dynamicStatsData.adoptedCats}
          unit="ตัว"
          color="#e11d48"
          onClick={() => onNavigate && onNavigate('cats', 'status', 'adopted')}
        />
        <StatCard
          icon={Home}
          title="กำลังหาบ้าน"
          value={dynamicStatsData.findingHomeCats}
          unit="ตัว"
          color="#16a34a"
          onClick={() => onNavigate && onNavigate('cats', 'status', 'available')}
        />
      </div>

      {/* Data Visualization Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Data Visualization</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
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

          {/* Unified Single Export Button for All Graphs */}
          <div className="export-all-charts-dropdown" style={{ position: 'relative' }}>
            <button
              onClick={() => setIsChartExportMenuOpen(prev => !prev)}
              disabled={isExporting}
              className="export-all-charts-btn"
              title="ส่งออกข้อมูลสถิติของทุกกราฟ (Excel / CSV)"
            >
              <FileSpreadsheet size={16} color="#10b981" />
              <span>Export กราฟ</span>
              <ChevronDown size={14} style={{ transform: isChartExportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isChartExportMenuOpen && (
              <div className="export-dropdown-popover">
                <button
                  onClick={() => {
                    handleExport('excel', 'charts');
                    setIsChartExportMenuOpen(false);
                  }}
                  className="export-popover-item"
                >
                  <FileSpreadsheet size={16} color="#10b981" />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>ส่งออกเป็น Excel (.xlsx)</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>รวมข้อมูลทุกกราฟแยกตาม Sheet</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleExport('csv', 'charts');
                    setIsChartExportMenuOpen(false);
                  }}
                  className="export-popover-item"
                >
                  <Download size={16} color="#4b5563" />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>ส่งออกเป็น CSV (.csv)</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ไฟล์ตารางสรุปข้อมูลทุกกราฟ</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleDownloadChartImage('charts-layout-container', 'Dashboard_Charts_Overview');
                    setIsChartExportMenuOpen(false);
                  }}
                  className="export-popover-item"
                >
                  <Image size={16} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>ส่งออกเป็นรูปภาพ (.png)</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>บันทึกภาพรวมทุกกราฟเป็นไฟล์ PNG</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="charts-layout" id="charts-layout-container">

        {/* Main Composed Chart */}
        <div className="chart-card" id="chart-monthly-trends">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h4 className="chart-title" style={{ margin: 0 }}>
              สถิติการรับเลี้ยงรายเดือน
              {breedFilter !== 'ทั้งหมด' ? (
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#7e22ce', marginTop: '4px', fontWeight: 'normal' }}>
                  (เฉพาะสายพันธุ์: {breedFilter})
                </span>
              ) : (
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginTop: '4px', fontWeight: 'normal' }}>
                  (คลิกที่แท่งกราฟเดือนที่ต้องการ เพื่อกรองข้อมูลกราฟด้านล่าง)
                </span>
              )}
            </h4>
            <button
              onClick={() => handleDownloadChartImage('chart-monthly-trends', 'สถิติการรับเลี้ยงรายเดือน')}
              className="chart-download-btn"
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280' }}
              title="ดาวน์โหลดเฉพาะกราฟนี้เป็นภาพ PNG"
            >
              <Camera size={14} color="#3b82f6" /> บันทึกรูป
            </button>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={filteredMonthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#fdf2f8' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', color: '#374151' }} />

                <Bar name="จำนวนแมวที่เข้าสู่ระบบ (ตัว)" dataKey="added" radius={[4, 4, 0, 0]} barSize={40} onClick={(entry) => handleBarClick(entry)} style={{ cursor: 'pointer' }}>
                  {filteredMonthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={activeShortMonth === entry.name ? '#f87171' : '#fca5a5'}
                      stroke={activeShortMonth === entry.name ? '#dc2626' : 'none'}
                      strokeWidth={activeShortMonth === entry.name ? 2 : 0}
                      opacity={activeShortMonth === 'ทั้งหมด' || activeShortMonth === entry.name ? 1 : 0.35}
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
          <div className="chart-card" id="chart-user-types">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h4 className="chart-title" style={{ margin: 0 }}>
                สัดส่วนประเภทผู้ใช้งาน
                {activeShortMonth !== 'ทั้งหมด' ? (
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginTop: '4px', fontWeight: 'normal' }}>
                    (เฉพาะเดือน: {activeShortMonth})
                  </span>
                ) : (
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#8b5cf6', marginTop: '4px', fontWeight: 'normal' }}>
                    (คลิกที่กราฟเพื่อกรองข้อมูลผู้ใช้)
                  </span>
                )}
              </h4>
              <button
                onClick={() => handleDownloadChartImage('chart-user-types', 'สัดส่วนประเภทผู้ใช้งาน')}
                className="chart-download-btn"
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280' }}
                title="ดาวน์โหลดเฉพาะกราฟนี้เป็นภาพ PNG"
              >
                <Camera size={14} color="#3b82f6" /> บันทึกรูป
              </button>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={activeUserTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                    onClick={(entry) => handlePieClick(entry)}
                    style={{ cursor: 'pointer' }}
                  >
                    {activeUserTypesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={filter === 'All' || filter === entry.name ? 1 : 0.35}
                        stroke={filter === entry.name ? '#4f46e5' : 'none'}
                        strokeWidth={filter === entry.name ? 3 : 0}
                      />
                    ))}
                    <Label
                      value={`${dynamicUsers.toLocaleString()} คน`}
                      position="center"
                      fill="#374151"
                      style={{ fontSize: '1.35rem', fontWeight: '700' }}
                    />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="chart-card" id="chart-cat-breeds">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h4 className="chart-title" style={{ margin: 0 }}>
                จำนวนแมวตามสายพันธุ์ยอดฮิต
                {filter !== 'All' && (
                  <span style={{ color: '#8b5cf6', marginLeft: '8px' }}>
                    (กลุ่ม: {filter})
                  </span>
                )}
                {activeShortMonth !== 'ทั้งหมด' && (
                  <span style={{ color: '#f87171', marginLeft: '8px' }}>
                    [เดือน: {activeShortMonth}]
                  </span>
                )}
              </h4>
              <button
                onClick={() => handleDownloadChartImage('chart-cat-breeds', 'จำนวนแมวตามสายพันธุ์ยอดฮิต')}
                className="chart-download-btn"
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280' }}
                title="ดาวน์โหลดเฉพาะกราฟนี้เป็นภาพ PNG"
              >
                <Camera size={14} color="#3b82f6" /> บันทึกรูป
              </button>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={activeCatBreedsData} margin={{ top: 20, bottom: 25, left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={45}
                    tick={({ x, y, payload }) => {
                      const text = payload.value || '';
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={12}
                            textAnchor="end"
                            fill="#6b7280"
                            fontSize={10.5}
                            fontWeight={500}
                            transform="rotate(-20)"
                          >
                            {text}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <Tooltip cursor={{ fill: '#fdf2f8' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                  <Bar name="จำนวน (ตัว)" dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={26} onClick={(entry) => handleBreedBarClick(entry)} style={{ cursor: 'pointer' }}>
                    {activeCatBreedsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={breedFilter === entry.name ? '#6d28d9' : '#8b5cf6'}
                        opacity={breedFilter === 'ทั้งหมด' || breedFilter === entry.name ? 1 : 0.35}
                        stroke={breedFilter === entry.name ? '#4c1d95' : 'none'}
                        strokeWidth={breedFilter === entry.name ? 2 : 0}
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
            {filteredPendingActions.map((item) => (
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
                    <span
                      className="action-link"
                      style={{ color: '#059669', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleOpenReport(item)}
                      title="คลิกเพื่อดูประวัติการตรวจสอบรายงานนี้"
                    >
                      <FileText size={15} /> ดูประวัติรายงาน
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pendingCurrentPage}
        totalItems={filteredPendingActions.length}
        itemsPerPage={pendingItemsPerPage}
        onPageChange={setPendingCurrentPage}
        onItemsPerPageChange={setPendingItemsPerPage}
      />

      {/* Report Inspection & History Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setSelectedReport(null)} />
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#1f2937', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedReport.status === 'Resolved' ? (
                <><CheckCircle size={22} color="#059669" /> ประวัติการตรวจสอบรายงาน</>
              ) : (
                <><AlertCircle size={22} color="#ef4444" /> ตรวจสอบรายงานปัญหา</>
              )}
            </h3>

            {/* Resolved Status Banner */}
            {selectedReport.status === 'Resolved' && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.875rem 1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>
                  <CheckCircle size={18} /> สถานะ: ดำเนินการแล้ว (Resolved)
                </div>
                {selectedReport.admin_note && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#047857' }}>
                    <strong>ผลการดำเนินการ:</strong> {selectedReport.admin_note}
                  </p>
                )}
                {selectedReport.handled_by && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#059669' }}>
                    <strong>ผู้ดำเนินการ:</strong> {selectedReport.handled_by} {selectedReport.handled_at ? `(${selectedReport.handled_at})` : ''}
                  </p>
                )}
              </div>
            )}

            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #f3f4f6' }}>
              <p style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>ผู้ถูกรายงาน:</strong> {selectedReport.username || 'ไม่ระบุ'}
                {selectedReport.reported_cat && (
                  <span style={{ fontSize: '0.82rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                    แมว: {selectedReport.reported_cat}
                  </span>
                )}
              </p>
              {selectedReport.reported_by && (
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>ผู้แจ้งรายงาน:</strong> {selectedReport.reported_by}
                </p>
              )}
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#4b5563' }}><strong>วันที่ส่งรายงาน:</strong> {selectedReport.date}</p>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#4b5563' }}><strong>หัวข้อที่ละเมิด:</strong> {selectedReport.issue}</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}><strong>รายละเอียด:</strong> {selectedReport.details || 'ผู้ใช้รายนี้มีการกระทำที่ขัดต่อกฎของชุมชน โปรดตรวจสอบหลักฐานและดำเนินการตามความเหมาะสม'}</p>
            </div>

            {/* Evidence Preview */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '0.95rem' }}>หลักฐาน / โพสต์ที่ถูกรายงาน:</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {selectedReport.evidence_image ? (
                  <div
                    style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => setPreviewImage(formatImageUrl(selectedReport.evidence_image))}
                    title="คลิกเพื่อดูภาพหลักฐานขนาดใหญ่"
                  >
                    <img
                      src={formatImageUrl(selectedReport.evidence_image)}
                      alt="Report evidence"
                      style={{
                        width: '110px',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.borderColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      fontWeight: '500',
                      backdropFilter: 'blur(2px)',
                      pointerEvents: 'none'
                    }}>
                      🔍 ขยาย
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '4px' }}>
                    ไม่มีภาพหลักฐานแนบ
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#1f2937' }}>
                    {selectedReport.issue}
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    เนื้อหาของ {selectedReport.username} ถูกรายงานเมื่อ {selectedReport.date}
                  </p>
                  {selectedReport.evidence_image && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(formatImageUrl(selectedReport.evidence_image))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        padding: 0,
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <ExternalLink size={14} /> ดูรูปหลักฐานขนาดเต็ม
                    </button>
                  )}
                  <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '0.85rem' }}>
                    <strong>ข้อสังเกต:</strong> อาจเข้าข่าย {selectedReport.issue}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {selectedReport.status === 'Resolved' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                  <CheckCircle size={16} /> รายงานนี้ดำเนินการเสร็จสิ้นแล้ว
                </span>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-success" onClick={() => setConfirmResolveAction('ignore')}>
                  <CheckCircle size={20} /> ไม่พบความผิด
                </button>
                <button className="btn-danger" onClick={() => setConfirmResolveAction('ban')}>
                  <Ban size={20} /> ระงับบัญชีผู้ใช้
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Report Resolution Action */}
      {confirmResolveAction && (
        <div className="modal-overlay" style={{ zIndex: 100050 }} onClick={() => setConfirmResolveAction(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setConfirmResolveAction(null)} />

            {confirmResolveAction === 'ignore' ? (
              <>
                <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#059669', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={26} color="#059669" /> ยืนยันปิดรายงาน (ไม่พบความผิด)
                </h3>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  คุณแน่ใจหรือไม่ว่าต้องการปิดรายงานปัญหานี้ โดยระบุว่า <strong>"ตรวจสอบแล้วไม่พบความผิดร้ายแรง"</strong>?<br />
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginTop: '6px' }}>
                    สถานะรายงานนี้จะถูกเปลี่ยนเป็น ดำเนินการแล้ว (Resolved)
                  </span>
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-cancel" onClick={() => setConfirmResolveAction(null)} disabled={resolveLoading}>
                    ยกเลิก
                  </button>
                  <button
                    className="btn-success"
                    onClick={() => handleResolveReport('ignore')}
                    disabled={resolveLoading}
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    {resolveLoading ? 'กำลังบันทึก...' : 'ยืนยัน ไม่พบความผิด'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Ban size={26} color="#dc2626" /> ยืนยันการระงับบัญชีผู้ใช้
                </h3>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  คุณแน่ใจหรือไม่ว่าต้องการ <strong style={{ color: '#dc2626' }}>ระงับบัญชีผู้ใช้ {selectedReport?.username || 'ผู้ถูกรายงาน'}</strong>?<br />
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginTop: '6px' }}>
                    การกระทำนี้จะระงับสิทธิ์การใช้งานของผู้ใช้และปิดรายงานนี้เป็นดำเนินการแล้ว (Resolved)
                  </span>
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-cancel" onClick={() => setConfirmResolveAction(null)} disabled={resolveLoading}>
                    ยกเลิก
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleResolveReport('ban')}
                    disabled={resolveLoading}
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    {resolveLoading ? 'กำลังระงับบัญชี...' : 'ยืนยัน ระงับบัญชี'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          style={{ zIndex: 100000, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="ปิดภาพขนาดใหญ่"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Full Report Evidence Preview"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            />
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={16} /> เปิดในแท็บใหม่
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  color: 'white',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

// --- Assessments Management Component ---

const AssessmentsManagement = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assessmentDetail, setAssessmentDetail] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(false);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAssessments();
      if (res.success && Array.isArray(res.data)) {
        setAssessments(res.data);
      }
    } catch (err) {
      console.error('Fetch assessments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleOpenDetail = async (item) => {
    setSelectedAssessment(item);
    setDetailLoading(true);
    try {
      const res = await adminApi.getAssessmentById(item.assessment_id);
      if (res.success && res.data) {
        setAssessmentDetail(res.data);
      }
    } catch (err) {
      console.error('Fetch assessment detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedAssessment) return;
    setUpdating(true);
    try {
      await adminApi.updateAssessmentStatus(selectedAssessment.assessment_id, status);
      await fetchAssessments();
      if (assessmentDetail) {
        setAssessmentDetail({ ...assessmentDetail, status });
      }
      setSelectedAssessment(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการปรับสถานะ: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = assessments.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Home Assessments
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
            ระบบประเมินความพร้อมและตรวจสอบสภาพแวดล้อมบ้านผู้ขอรับเลี้ยง
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">ทุกสถานะ</option>
            <option value="pending">รอการตรวจสอบ (Pending)</option>
            <option value="approved">ผ่านการพิจารณา (Approved)</option>
            <option value="rejected">ไม่ผ่านเกณฑ์ (Rejected)</option>
          </select>
          <button
            className="btn-action-info"
            onClick={fetchAssessments}
            title="รีเฟรชข้อมูล"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> รีเฟรช
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto' }} />
          <p>กำลังโหลดข้อมูลแบบประเมิน...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>ไม่พบรายการแบบประเมินตามเงื่อนไขที่เลือก</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ผู้ขอรับเลี้ยง</th>
                <th>น้องแมว</th>
                <th>คะแนนความเข้ากันได้</th>
                <th>ระดับความเหมาะสม</th>
                <th>สถานะ</th>
                <th>วันที่ประเมิน</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.assessment_id}>
                  <td>#{item.assessment_id}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.applicant_name || item.applicant_username || 'ผู้ใช้ #' + item.applicant_id}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.applicant_phone || item.applicant_email || '-'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.cat_image && (
                        <img
                          src={item.cat_image.startsWith('http') ? item.cat_image : `http://localhost:3000${item.cat_image}`}
                          alt={item.cat_name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      )}
                      <div>
                        <strong>{item.cat_name || 'แมว #' + item.cat_id}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.pet_breed || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: Number(item.match_percentage || item.total_score) >= 70 ? '#10b981' : '#f59e0b' }}>
                      {item.match_percentage ? `${Number(item.match_percentage).toFixed(0)}%` : `${item.total_score} คะแนน`}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.suitability_level === 'highly_suitable' ? 'success' :
                      item.suitability_level === 'suitable' ? 'success' :
                        item.suitability_level === 'consider' ? 'pending' : 'danger'
                      }`}>
                      {item.suitability_level === 'highly_suitable' ? 'เหมาะสมอย่างยิ่ง' :
                        item.suitability_level === 'suitable' ? 'เหมาะสม' :
                          item.suitability_level === 'consider' ? 'ควรพิจารณา' : 'ไม่เหมาะสม'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status === 'approved' ? 'active' :
                      item.status === 'rejected' ? 'hidden' : 'pending'
                      }`}>
                      {item.status === 'approved' ? 'อนุมัติแล้ว' :
                        item.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {item.assessed_at ? new Date(item.assessed_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td>
                    <button
                      className="btn-action-info btn-sm"
                      onClick={() => handleOpenDetail(item)}
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment Detail & Approval Modal */}
      {selectedAssessment && (
        <div className="modal-overlay" onClick={() => setSelectedAssessment(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setSelectedAssessment(null)} />

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: '#e0e7ff', borderRadius: '50%', marginBottom: '0.75rem', color: '#4f46e5' }}>
                <FileText size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                แบบประเมินความพร้อม #{selectedAssessment.assessment_id}
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                ผู้ขอรับเลี้ยง: <strong>{selectedAssessment.applicant_name || selectedAssessment.applicant_username}</strong> |
                น้องแมว: <strong>{selectedAssessment.cat_name}</strong>
              </p>
            </div>

            {/* Score Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              backgroundColor: '#f3f4f6',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>คะแนนความเข้ากันได้</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>
                  {selectedAssessment.match_percentage ? `${Number(selectedAssessment.match_percentage).toFixed(0)}%` : `${selectedAssessment.total_score}`}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #d1d5db' }}></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>ระดับความเหมาะสม</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                  {selectedAssessment.suitability_level === 'highly_suitable' ? 'เหมาะสมอย่างยิ่ง ⭐' :
                    selectedAssessment.suitability_level === 'suitable' ? 'เหมาะสม ✅' :
                      selectedAssessment.suitability_level === 'consider' ? 'ควรพิจารณา ⚠️' : 'ไม่เหมาะสม ❌'}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #d1d5db' }}></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>สถานะปัจจุบัน</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: selectedAssessment.status === 'approved' ? '#10b981' : selectedAssessment.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                  {selectedAssessment.status === 'approved' ? 'อนุมัติแล้ว' : selectedAssessment.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {selectedAssessment.recommendation && (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1rem' }}>💡 สรุปผลการวิเคราะห์และความเข้ากันได้:</h4>
                <div style={{ margin: 0, color: '#1e3a8a', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {selectedAssessment.recommendation.split('|').map((rec, i) => (
                    <span key={i} style={{ display: 'block', marginBottom: '4px' }}>• {rec.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Criteria Breakdown */}
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                <span>กำลังโหลดรายละเอียดเกณฑ์ย่อย...</span>
              </div>
            ) : assessmentDetail?.details?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                  คะแนนแยกตามเกณฑ์ 4 ด้าน:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {assessmentDetail.details.map((d, idx) => (
                    <div key={idx} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>
                        {d.criteria_name || d.criteria_code || `เกณฑ์ที่ ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                        คะแนนที่ได้: <strong style={{ color: getScoreColor(d.score_received, d.max_score, d.is_blocking) }}>{d.score_received}</strong> <span style={{ color: '#1f2937', fontWeight: 'bold' }}>/ {d.max_score || 25}</span>
                      </div>
                      {d.explanation && (
                        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>{d.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                className="btn-cancel"
                onClick={() => setSelectedAssessment(null)}
                disabled={updating}
              >
                ปิด
              </button>
              <button
                className="btn-danger"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updating || selectedAssessment.status === 'rejected'}
                style={{ opacity: selectedAssessment.status === 'rejected' ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <XCircle size={18} /> ปฏิเสธ (Reject)
              </button>
              <button
                className="btn-success"
                onClick={() => handleUpdateStatus('approved')}
                disabled={updating || selectedAssessment.status === 'approved'}
                style={{ opacity: selectedAssessment.status === 'approved' ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle size={18} /> อนุมัติ (Approve)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Adoption Applications Management Component ---

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPasswordAuthModal, setShowPasswordAuthModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordAuthError, setPasswordAuthError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);

  const handleOpenChatClick = () => {
    if (isChatUnlocked) {
      setShowChatModal(true);
    } else {
      setAdminPasswordInput('');
      setPasswordAuthError('');
      setShowPasswordAuthModal(true);
    }
  };

  const handleVerifyChatPassword = async (e) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) {
      setPasswordAuthError('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }
    setVerifyingPassword(true);
    setPasswordAuthError('');
    try {
      const res = await adminApi.verifyAdminPassword(adminPasswordInput, appDetail?.match_id);
      if (res && res.success) {
        setIsChatUnlocked(true);
        setShowPasswordAuthModal(false);
        setShowChatModal(true);
      } else {
        setPasswordAuthError(res?.message || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setPasswordAuthError(err.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Override modal state
  const [targetStatus, setTargetStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const filteredApps = applications.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, applications]);

  const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await adminApi.getApplications(params);
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error('Fetch applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleOpenDetail = async (app) => {
    setSelectedApp(app);
    setAppDetail(null);
    setShowChatModal(false);
    setTargetStatus(app.status);
    setOverrideReason('');
    setActionSuccessMsg('');
    setDetailLoading(true);
    try {
      const res = await adminApi.getApplicationById(app.match_id);
      if (res.success && res.data) {
        setAppDetail(res.data);
      }
    } catch (err) {
      console.error('Fetch application detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOverrideStatus = async (newStatus) => {
    if (!selectedApp) return;
    const finalStatus = newStatus || targetStatus;
    if (!finalStatus) return;

    setOverrideLoading(true);
    setActionSuccessMsg('');
    try {
      const res = await adminApi.overrideApplicationStatus(selectedApp.match_id, finalStatus, overrideReason);
      if (res.success) {
        setActionSuccessMsg(res.message || 'บันทึกสถานะเรียบร้อยแล้ว');
        setSelectedApp(prev => prev ? { ...prev, status: finalStatus } : null);
        if (appDetail) {
          setAppDetail(prev => ({
            ...prev,
            status: finalStatus,
            cat_status: finalStatus === 'approved' ? 'adopted' : (prev.cat_status === 'adopted' ? 'available' : prev.cat_status)
          }));
        }
        await fetchApplications();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  const countPending = applications.filter(a => a.status === 'pending').length;
  const countApproved = applications.filter(a => a.status === 'approved').length;
  const countRejected = applications.filter(a => a.status === 'rejected').length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={28} color="#f43f5e" /> Adoption Applications
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            จัดการคำขอรับเลี้ยง
          </p>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '4px 10px' }}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="ชื่อแมว, ผู้ขอ หรือเจ้าของ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '6px 8px', fontSize: '0.9rem', width: '200px' }}
            />
            {searchQuery && (
              <X size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => { setSearchQuery(''); setTimeout(fetchApplications, 0); }} />
            )}
          </form>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 1rem' }}
          >
            <option value="All">ทุกสถานะ (All)</option>
            <option value="pending">รอพิจารณา (Pending)</option>
            <option value="approved">อนุมัติแล้ว (Approved)</option>
            <option value="rejected">ปฏิเสธ (Rejected)</option>
          </select>

          <button
            className="btn-action-info"
            onClick={fetchApplications}
            title="รีเฟรชข้อมูล"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.25rem' }}
          >
            <RefreshCw size={16} /> รีเฟรช
          </button>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* All Card */}
        <div
          onClick={() => setStatusFilter('All')}
          style={{
            backgroundColor: '#fff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="คลิกเพื่อเลือกแสดงคำขอทั้งหมด"
        >
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>คำขอทั้งหมด</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>{applications.length} รายการ</div>
        </div>

        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter('pending')}
          style={{
            backgroundColor: statusFilter === 'pending' ? '#fffbeb' : '#fff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: statusFilter === 'pending' ? '2px solid #d97706' : '1px solid #fef3c7',
            boxShadow: statusFilter === 'pending' ? '0 4px 12px rgba(217, 119, 6, 0.2)' : 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: statusFilter === 'pending' ? 'translateY(-2px)' : 'none'
          }}
          title="คลิกเพื่อกรองคำขอที่รอพิจารณา"
        >
          <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: statusFilter === 'pending' ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>รอพิจารณา (Pending)</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>{countPending}</div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setStatusFilter('approved')}
          style={{
            backgroundColor: statusFilter === 'approved' ? '#ecfdf5' : '#fff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: statusFilter === 'approved' ? '2px solid #059669' : '1px solid #d1fae5',
            boxShadow: statusFilter === 'approved' ? '0 4px 12px rgba(5, 150, 105, 0.2)' : 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: statusFilter === 'approved' ? 'translateY(-2px)' : 'none'
          }}
          title="คลิกเพื่อกรองคำขอที่อนุมัติแล้ว"
        >
          <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: statusFilter === 'approved' ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>อนุมัติรับเลี้ยง (Approved)</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#059669', marginTop: '4px' }}>{countApproved}</div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setStatusFilter('rejected')}
          style={{
            backgroundColor: statusFilter === 'rejected' ? '#fef2f2' : '#fff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: statusFilter === 'rejected' ? '2px solid #dc2626' : '1px solid #fee2e2',
            boxShadow: statusFilter === 'rejected' ? '0 4px 12px rgba(220, 38, 38, 0.2)' : 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: statusFilter === 'rejected' ? 'translateY(-2px)' : 'none'
          }}
          title="คลิกเพื่อกรองคำขอที่ไม่ผ่านการพิจารณา"
        >
          <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: statusFilter === 'rejected' ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ปฏิเสธ (Rejected)</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>{countRejected}</div>
        </div>
      </div>

      {/* Applications List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto' }} />
          <p>กำลังโหลดข้อมูลคำขอรับเลี้ยง...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>ไม่พบรายการคำขอรับเลี้ยงตามเงื่อนไขที่เลือก</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>น้องแมว</th>
                  <th>ผู้ขอรับเลี้ยง</th>
                  <th>ผู้โพสต์</th>
                  <th>Match Score</th>
                  <th>สถานะคำขอ</th>
                  <th>วันที่ยื่นคำขอ</th>
                  <th>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map(item => (
                  <tr key={item.match_id}>
                    <td><strong>#{item.match_id}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={formatImageUrl(item.cat_image) || getFallbackCatImage(item.cat_id || item.match_id)}
                          alt={item.pet_name}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFallbackCatImage(item.cat_id || item.match_id);
                          }}
                        />
                        <div>
                          <strong>{item.pet_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.pet_breed || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.applicant_name || item.applicant_username}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📞 {item.applicant_phone || '-'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.poster_name || item.poster_username}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📞 {item.poster_phone || '-'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: Number(item.matchscore) >= 70 ? '#10b981' : '#f59e0b' }}>
                        {item.matchscore ? `${Number(item.matchscore).toFixed(0)}%` : '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'pending' ? 'รอพิจารณา' :
                          item.status === 'interview' ? 'นัดสัมภาษณ์' :
                            item.status === 'approved' ? 'อนุมัติแล้ว' :
                              item.status === 'rejected' ? 'ปฏิเสธ' : item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {item.applied_at ? new Date(item.applied_at).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td>
                      <button
                        className="btn-action-info btn-sm"
                        onClick={() => handleOpenDetail(item)}
                      >
                        ดูรายละเอียด / จัดการ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApps.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* Deep Dive & Override Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <X className="modal-close" size={24} onClick={() => setSelectedApp(null)} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', padding: '10px', backgroundColor: '#ffe4e6', borderRadius: '50%', marginBottom: '0.5rem', color: '#f43f5e' }}>
                <Heart size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                คำขอรับเลี้ยง #{selectedApp.match_id}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                ยื่นเมื่อ: {selectedApp.applied_at ? new Date(selectedApp.applied_at).toLocaleDateString('th-TH') : '-'}
              </p>
            </div>

            {/* Success notification if action taken */}
            {actionSuccessMsg && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
                <CheckCircle size={20} color="#10b981" />
                <span style={{ fontWeight: '500' }}>{actionSuccessMsg}</span>
              </div>
            )}

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem auto' }} />
                <span>กำลังโหลดข้อมูลคำขอรับเลี้ยงแบบละเอียด...</span>
              </div>
            ) : appDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Quick Stats Banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '2px' }}>คะแนนความเข้ากันได้</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {appDetail.matchscore ? `${Number(appDetail.matchscore).toFixed(0)}%` : '-'}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0' }}></div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '2px' }}>สถานะคำขอปัจจุบัน</div>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`status-badge ${appDetail.status}`}>
                        {appDetail.status === 'pending' ? 'รอพิจารณา' :
                          appDetail.status === 'interview' ? 'นัดสัมภาษณ์' :
                            appDetail.status === 'approved' ? 'อนุมัติแล้ว' :
                              appDetail.status === 'rejected' ? 'ปฏิเสธ' : appDetail.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0' }}></div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '2px' }}>สถานะน้องแมว</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: appDetail.cat_status === 'adopted' ? '#f43f5e' : '#10b981', marginTop: '4px' }}>
                      {appDetail.cat_status === 'adopted' ? 'รับเลี้ยงแล้ว (Adopted)' : 'ยังอยู่ (Available)'}
                    </div>
                  </div>
                </div>

                {/* 2. Grid: Cat Info & Parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Cat Box */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <img
                        src={formatImageUrl(appDetail.cat_image) || getFallbackCatImage(appDetail.cat_id)}
                        alt={appDetail.pet_name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getFallbackCatImage(appDetail.cat_id);
                        }}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1f2937' }}>🐱 {appDetail.pet_name}</h4>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{appDetail.pet_breed} | {appDetail.cat_gender === 'male' ? 'เพศผู้' : 'เพศเมีย'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>อายุ: {appDetail.cat_age ? `${appDetail.cat_age} เดือน` : 'ไม่ระบุ'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                      <div><strong>นิสัย:</strong> {appDetail.personality || 'ไม่ระบุ'}</div>
                      <div><strong>สุขภาพ:</strong> {appDetail.health_note || 'แข็งแรงดี'}</div>
                      <div><strong>ค่าใช้จ่ายประมาณ:</strong> {appDetail.est_monthly_cost ? `${Number(appDetail.est_monthly_cost).toLocaleString()} บาท/เดือน` : '-'}</div>
                    </div>
                  </div>

                  {/* Parties Box */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>👥 ข้อมูลการติดต่อ</h4>

                    <div style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2563eb' }}>ผู้ขอรับเลี้ยง (Applicant):</div>
                      <div style={{ fontSize: '0.9rem', color: '#1f2937' }}>{appDetail.applicant_name} (@{appDetail.applicant_username})</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📞 {appDetail.applicant_phone || '-'} | ✉️ {appDetail.applicant_email || '-'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7c3aed' }}>เจ้าของเดิม / ผู้ลงประกาศ (Poster):</div>
                      <div style={{ fontSize: '0.9rem', color: '#1f2937' }}>{appDetail.poster_name} (@{appDetail.poster_username})</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📞 {appDetail.poster_phone || '-'} | ✉️ {appDetail.poster_email || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* 3. Applicant Profile & Home Environment */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={18} color="#3b82f6" /> ข้อมูลความพร้อมและที่พักอาศัยของผู้ขอเลี้ยง
                  </h4>
                  {appDetail.applicant_profile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', color: '#374151' }}>
                      <div><strong>ประเภทที่พัก:</strong> {appDetail.applicant_profile.living_space_type || 'ไม่ระบุ'}</div>
                      <div><strong>ขนาดพื้นที่:</strong> {appDetail.applicant_profile.space_size ? `${appDetail.applicant_profile.space_size} ตร.ม.` : 'ไม่ระบุ'}</div>
                      <div><strong>งบประมาณ/เดือน:</strong> {appDetail.applicant_profile.max_monthly_budget ? `${Number(appDetail.applicant_profile.max_monthly_budget).toLocaleString()} บาท` : 'ไม่ระบุ'}</div>
                      <div><strong>เวลาว่างดูแล:</strong> {appDetail.applicant_profile.daily_free_hours ? `${appDetail.applicant_profile.daily_free_hours} ชม./วัน` : 'ไม่ระบุ'}</div>
                      <div><strong>สัตว์เลี้ยงอื่นในบ้าน:</strong> {appDetail.applicant_profile.has_other_pets ? 'มี' : 'ไม่มี'}</div>
                      <div><strong>เด็กเล็กในบ้าน:</strong> {appDetail.applicant_profile.has_children ? 'มี' : 'ไม่มี'}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>ประสบการณ์เลี้ยงสัตว์:</strong> {appDetail.applicant_profile.experience || 'ไม่ระบุ'}</div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>ผู้ใช้ยังไม่ได้กรอกแบบฟอร์มข้อมูลที่พักอาศัย (user_profiles)</p>
                  )}
                  {appDetail.upload_remark && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                      <strong>หมายเหตุเพิ่มเติมจากผู้ขอ:</strong> {appDetail.upload_remark}
                    </div>
                  )}
                </div>

                {/* 4. Assessment Summary & 4 Criteria Breakdown */}
                {appDetail.assessment && (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={20} color="#1d4ed8" /> รายละเอียดผลการประเมินความพร้อม (4 เกณฑ์หลัก)
                      </h4>
                      <span className="badge success" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {appDetail.assessment.suitability_level === 'highly_suitable' ? 'เหมาะสมอย่างยิ่ง ⭐' :
                          appDetail.assessment.suitability_level === 'suitable' ? 'เหมาะสม ✅' :
                            appDetail.assessment.suitability_level === 'consider' ? 'ควรพิจารณา ⚠️' : 'ไม่เหมาะสม ❌'}
                      </span>
                    </div>

                    {appDetail.assessment.recommendation && (
                      <div style={{ fontSize: '0.85rem', color: '#1e3a8a', lineHeight: '1.6', marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#dbeafe', borderRadius: '10px' }}>
                        <strong>คำแนะนำ:</strong> {appDetail.assessment.recommendation}
                      </div>
                    )}

                    {/* 4 Criteria Breakdown Cards */}
                    {((appDetail.assessment.details && appDetail.assessment.details.length > 0) || (appDetail.assessment_details && appDetail.assessment_details.length > 0)) && (
                      <div>
                        <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                          คะแนนแยกตามเกณฑ์ 4 ด้าน:
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
                          {(appDetail.assessment.details || appDetail.assessment_details).map((item, idx) => (
                            <div key={idx} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937', marginBottom: '0.35rem' }}>
                                {item.criteria_name || item.topic || `เกณฑ์ที่ ${idx + 1}`}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                คะแนนที่ได้: <strong style={{ color: getScoreColor(item.score_received, item.max_score, item.is_blocking) }}>{Number(item.score_received || 0).toFixed(2)}</strong> <span style={{ color: '#1f2937', fontWeight: 'bold' }}>/ {Number(item.max_score || 25).toFixed(2)}</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.25rem' }}>
                                {item.explanation || item.condition || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Chat History Inspection */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={18} color="#8b5cf6" /> ประวัติการสนทนา ({appDetail.chat_history?.length || 0} ข้อความ)
                    </h4>
                    {appDetail.chat_history && appDetail.chat_history.length > 0 && (
                      <button
                        onClick={handleOpenChatClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#f3e8ff',
                          color: '#6b21a8',
                          border: '1px solid #d8b4fe',
                          borderRadius: '8px',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title="ดูบทสนทนาทั้งหมด (ต้องยืนยันรหัสผ่านแอดมิน)"
                      >
                        <Lock size={14} /> ดูประวัติแชททั้งหมด
                      </button>
                    )}
                  </div>

                  {appDetail.chat_history && appDetail.chat_history.length > 0 ? (
                    <div>
                      {/* Show latest message preview */}
                      {(() => {
                        const latestMsg = appDetail.chat_history[appDetail.chat_history.length - 1];
                        const isApplicant = latestMsg.sender_id === appDetail.applicant_id;
                        return (
                          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.8rem', color: '#6b7280' }}>
                              <strong style={{ color: isApplicant ? '#2563eb' : '#7c3aed' }}>
                                {isApplicant ? `👤 ${latestMsg.sender_name || 'ผู้ขอรับเลี้ยง'}` : `🏠 ${latestMsg.sender_name || 'เจ้าของเดิม'}`} (ข้อความล่าสุด)
                              </strong>
                              <span>{latestMsg.sent_at ? new Date(latestMsg.sent_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {latestMsg.message_text}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.25rem', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#9ca3af', fontSize: '0.85rem' }}>
                      ยังไม่มีประวัติการส่งข้อความสนทนาในระบบ
                    </div>
                  )}
                </div>

                {/* Close Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', marginTop: '1rem' }}>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setSelectedApp(null);
                      setShowChatModal(false);
                    }}
                    style={{ padding: '0.5rem 1.5rem', fontSize: '0.95rem' }}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* Password Verification Modal for Viewing Chat */}
      {showPasswordAuthModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowPasswordAuthModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '1.75rem', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={22} color="#8b5cf6" /> ยืนยันรหัสผ่านเพื่อเข้าดูแชท
              </h3>
              <X className="modal-close" size={22} onClick={() => setShowPasswordAuthModal(false)} />
            </div>

            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              เพื่อความเป็นส่วนตัวของผู้ใช้งาน กรุณากรอกรหัสผ่านผู้ดูแลระบบ (Password ของบัญชีแอดมิน) เพื่อยืนยันสิทธิ์ในการดูประวัติการสนทนา
            </p>

            <form onSubmit={handleVerifyChatPassword}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  กรุณากรอกรหัสผ่าน :
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่าน..."
                  value={adminPasswordInput}
                  onChange={(e) => { setAdminPasswordInput(e.target.value); setPasswordAuthError(''); }}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '10px',
                    border: passwordAuthError ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  autoFocus
                />
                {passwordAuthError && (
                  <div style={{ color: '#ef4444', fontSize: '0.825rem', marginTop: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} /> {passwordAuthError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowPasswordAuthModal(false)}
                  disabled={verifyingPassword}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={verifyingPassword}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {verifyingPassword ? (
                    <><Loader2 className="animate-spin" size={16} /> กำลังตรวจสอบ...</>
                  ) : (
                    <><Lock size={16} /> ยืนยันเพื่อดูแชท</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Chat History Modal */}
      {showChatModal && appDetail && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowChatModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} color="#8b5cf6" /> ประวัติการสนทนา - น้อง{appDetail.pet_name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1d4ed8', fontWeight: '600' }}>👤 {appDetail.applicant_name} (ผู้ขอรับเลี้ยง)</span>
                  <span style={{ margin: '0 8px', color: '#9ca3af' }}>↔</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: '600' }}>🏠 {appDetail.poster_name} (เจ้าของเดิม)</span>
                </div>
              </div>
              <X className="modal-close" size={22} onClick={() => setShowChatModal(false)} />
            </div>

            <div className="chat-container" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem',
              maxHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {(() => {
                let lastDateStr = '';
                return appDetail.chat_history && appDetail.chat_history.map((msg, index) => {
                  const isApplicant = msg.sender_id === appDetail.applicant_id;
                  const dateObj = msg.sent_at ? new Date(msg.sent_at) : null;
                  const dateStr = dateObj ? dateObj.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
                  const showDatePill = dateStr && dateStr !== lastDateStr;
                  if (showDatePill) lastDateStr = dateStr;

                  const timeStr = dateObj ? dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <React.Fragment key={msg.message_id || index}>
                      {showDatePill && (
                        <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                          <span style={{
                            backgroundColor: '#e5e7eb',
                            color: '#475569',
                            borderRadius: '12px',
                            padding: '3px 14px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            letterSpacing: '0.3px'
                          }}>
                            {dateStr}
                          </span>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isApplicant ? 'flex-start' : 'flex-end',
                        maxWidth: '100%',
                        margin: '2px 0'
                      }}>
                        {/* Sender Name badge above message */}
                        <div style={{
                          fontSize: '0.75rem',
                          color: isApplicant ? '#1d4ed8' : '#15803d',
                          marginBottom: '3px',
                          fontWeight: '600',
                          paddingLeft: isApplicant ? '4px' : '0',
                          paddingRight: !isApplicant ? '4px' : '0'
                        }}>
                          {isApplicant ? `👤 ${msg.sender_name || 'ผู้ขอรับเลี้ยง'}` : `🏠 ${msg.sender_name || 'เจ้าของเดิม'}`}
                        </div>

                        {/* Bubble and Timestamp Container */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '6px',
                          flexDirection: isApplicant ? 'row' : 'row-reverse',
                          maxWidth: '82%'
                        }}>
                          {/* Chat Bubble */}
                          <div style={{
                            backgroundColor: isApplicant ? '#eff6ff' : '#dcfce7',
                            color: isApplicant ? '#1e3a8a' : '#14532d',
                            border: isApplicant ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                            borderRadius: isApplicant ? '18px 18px 18px 3px' : '18px 18px 3px 18px',
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.925rem',
                            lineHeight: '1.45',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            wordBreak: 'break-word',
                            position: 'relative'
                          }}>
                            {msg.message_text}
                          </div>

                          {/* Timestamp outside bubble (No "Read" / "อ่านแล้ว" text) */}
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#6b7280',
                            whiteSpace: 'nowrap',
                            marginBottom: '2px',
                            fontWeight: '500'
                          }}>
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                className="btn-cancel"
                onClick={() => setShowChatModal(false)}
                style={{ padding: '0.4rem 1.25rem', fontSize: '0.9rem' }}
              >
                ปิดหน้าต่างแชท
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App & Login ---

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminApi.login(username, password);
      if (res.success && res.role === 'admin') {
        onLogin();
      } else if (res.role && res.role !== 'admin') {
        setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ (Admin Only)');
      } else {
        setError(res.message || 'Username หรือ Password ไม่ถูกต้อง');
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้');
    } finally {
      setLoading(false);
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
              placeholder="Username"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#f43f5e',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('adminToken')));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [catStatusFilter, setCatStatusFilter] = useState('all');
  const storedUser = getStoredUser();

  const handleDashboardNavigate = (targetTab, filterType, filterValue) => {
    if (targetTab === 'users') {
      setUserRoleFilter(filterValue);
      setActiveTab('users');
    } else if (targetTab === 'cats') {
      setCatStatusFilter(filterValue);
      setActiveTab('cats');
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  const fetchPendingNotifications = async () => {
    try {
      const res = await adminApi.getReports({ status: 'Pending' });
      if (res?.success && Array.isArray(res.reports)) {
        setNotifications(res.reports);
        setUnreadCount(res.reports.length);
      }
    } catch (err) {
      console.error('Fetch pending notifications error:', err);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPendingNotifications();

    const token = localStorage.getItem('adminToken');
    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket] Connected to backend for notifications');
    });

    socket.on('new_report', (newReport) => {
      console.log('🚨 [Socket] Received new_report event:', newReport);
      playNotificationChime();

      setNotifications(prev => [newReport, ...prev.filter(n => n.id !== newReport.id)]);
      setUnreadCount(prev => prev + 1);

      setActiveToast({
        id: Date.now(),
        title: '🚨 มีการรายงานปัญหาใหม่เข้ามา!',
        reporter: newReport.reported_by || 'ผู้ใช้งาน',
        issue: newReport.issue || newReport.reason || 'รายงานความผิด',
        report: newReport
      });

      window.dispatchEvent(new CustomEvent('report:new', { detail: newReport }));
    });

    const interval = setInterval(fetchPendingNotifications, 20000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="admin-layout">
      {/* Real-time Toast Banner Alert */}
      {activeToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderLeft: '6px solid #ef4444',
          padding: '1rem 1.25rem',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#111827' }}>
                {activeToast.title}
              </h4>
              <button
                onClick={() => setActiveToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.4' }}>
              <strong>ผู้รายงาน:</strong> {activeToast.reporter}<br />
              <strong>หัวข้อ:</strong> {activeToast.issue}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveToast(null);
                  setActiveTab('dashboard');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('report:open', { detail: activeToast.report }));
                  }, 100);
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                ดูการรายงาน
              </button>
              <button
                onClick={() => setActiveToast(null)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cat size={28} />
          <h2 style={{ margin: 0, fontWeight: 600 }}>Pet Adoption Admin</h2>
        </div>
        <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard (สถิติภาพรวม)"
          >
            <LayoutGrid size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
            title="Applications (คำขอรับเลี้ยง)"
          >
            <Heart size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
            title="Evaluation Criteria (เกณฑ์การประเมิน)"
          >
            <ClipboardList size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            title="Users (จัดการสมาชิก)"
          >
            <User size={24} />
          </div>
          <div
            className={`nav-item ${activeTab === 'cats' ? 'active' : ''}`}
            onClick={() => setActiveTab('cats')}
            title="Cats (จัดการประกาศแมว)"
          >
            <Cat size={24} />
          </div>

          {/* Notification Bell Button */}
          <div style={{ position: 'relative' }}>
            <div
              className="nav-item"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="การแจ้งเตือนรายงานปัญหา"
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            {/* Notification Dropdown Menu */}
            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '340px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                zIndex: 1000,
                overflow: 'hidden',
                color: '#1f2937'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} style={{ color: '#ef4444' }} />
                    <strong style={{ fontSize: '0.95rem' }}>รายงานเข้ามาใหม่</strong>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setUnreadCount(0)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                      ไม่มีการแจ้งเตือนรายงานใหม่
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={n.id || idx}
                        onClick={() => {
                          setShowNotifDropdown(false);
                          setActiveTab('dashboard');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('report:open', { detail: n }));
                          }, 100);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          backgroundColor: n.status === 'Pending' ? '#fef2f2' : 'white'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.status === 'Pending' ? '#fef2f2' : 'white'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>
                            {n.reported_by || 'ผู้ใช้งาน'} แจ้งรายงาน
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {n.date || 'ใหม่'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#4b5563' }}>
                          หัวข้อ: <strong>{n.issue || n.reason || 'รายงานความผิด'}</strong>
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${(n.status || 'pending').toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {n.status || 'Pending'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '500' }}>
                            ดูรายละเอียด →
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.4)', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
              👤 {storedUser?.username || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
              title="ออกจากระบบ"
            >
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'applications' ? (
          <ApplicationsManagement />
        ) : activeTab === 'evaluation' ? (
          <EvaluationCriteria />
        ) : activeTab === 'users' ? (
          <UserManagement initialRoleFilter={userRoleFilter} />
        ) : activeTab === 'cats' ? (
          <CatManagement />
        ) : (
          <Dashboard onNavigate={handleDashboardNavigate} />
        )}
      </main>
    </div>
  );
}

export default App;

