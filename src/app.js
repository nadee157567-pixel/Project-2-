const express = require('express');
const cors = require('cors');

const catRouter = require('./routes/catRoutes');
const matchingRouter = require('./routes/matchingRoutes');
const evaluateRoute = require('./routes/evaluate');
const authRouter = require('./routes/authRoutes');
const adopterRouter = require('./routes/adopterRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

// ตรวจสอบ backend ว่าทำงานหรือไม่

app.get('/',(req,res) => {
    res.status(200).json({
        success: true,
        message: 'Pet Adoption API is running',
    });
});

//Routes

app.use('/api/cats',catRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/evaluate', evaluateRoute);
app.use('/api/auth', authRouter);
app.use('/api/adopters', adopterRouter);

//กรณีเรียก URL ที่ไม่มีอยู่

app.use((req,res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบ API ที่เรียกใช้งาน'
    });
});

module.exports = app;