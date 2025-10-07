const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const voterRoutes = require('./routes/voters');
const colonyRoutes = require('./routes/colonies');
const grampanchayatRoutes = require('./routes/grampanchayat');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for form-data parsing
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use multer middleware for all routes to parse form-data
app.use(upload.none());

// Debug middleware to log form data
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Request Body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/colonies', colonyRoutes);
app.use('/api/grampanchayat', grampanchayatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Voters API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: true,
        code: 500,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: true,
        code: 404,
        message: 'Route not found'
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Local: http://localhost:${PORT}`);
            console.log(`Network: http://10.106.137.165:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();