const express = require('express');
const cors = require('cors');
const path = require('path');

// --- User / Public Routes (Mobile App) ---
const authRouter = require('./routes/authRoutes');
const catRouter = require('./routes/catRoutes');
const matchingRouter = require('./routes/matchingRoutes');
const evaluateRoute = require('./routes/evaluate');
const adopterRouter = require('./routes/adopterRoutes');
const chatRouter = require('./routes/chatRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');

// --- Admin Routes (Admin Web Portal) ---
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminAssessmentRoutes = require('./routes/adminAssessmentRoutes');
const adminCriteriaRoutes = require('./routes/adminCriteriaRoutes');
const adminCatRoutes = require('./routes/adminCatRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminProfileRoutes = require('./routes/adminProfileRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminLogRoutes = require('./routes/adminLogRoutes');

const app = express();

// --- Middlewares ---
app.use(cors({
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/upload', express.static(path.join(__dirname, '../upload')));

// --- Health Check Endpoint ---
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Pet Adoption API is running',
    });
});

// --- User & Adopter Routes ---
app.use('/api/auth', authRouter);
app.use('/api/cats', catRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/evaluate', evaluateRoute);
app.use('/api/adopters', adopterRouter);
app.use('/api/chats', chatRouter);
app.use('/api/adoption', adoptionRoutes);


// --- Admin Routes ---
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/assessments', adminAssessmentRoutes);
app.use('/api/admin/criteria', adminCriteriaRoutes);
app.use('/api/admin/cats', adminCatRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/applications', adminApplicationRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/logs', adminLogRoutes);



// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบ API ที่เรียกใช้งาน'
    });
});

module.exports = app;