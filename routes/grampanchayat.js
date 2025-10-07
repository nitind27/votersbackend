const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Fetch grampanchayat data
router.get('/fetch', async (req, res) => {
    const connection = getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM tbl_category WHERE maintanance = "Yes" AND status = "Active"'
        );

        res.json(rows);

    } catch (error) {
        console.error('Fetch grampanchayat error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

module.exports = router;