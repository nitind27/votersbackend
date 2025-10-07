const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// User Login - Accept form-data
router.post('/login', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const username = req.body.username ? req.body.username.trim() : '';
        const password = req.body.password ? req.body.password.trim() : '';
        const device_uid = req.body.device_uid ? req.body.device_uid.trim() : '';

        if (!username || !password) {
            return res.status(400).json({
                error: true,
                code: 500,
                message: 'All fields are required.'
            });
        }

        // Step 1: Check username exists and active
        const [userRows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND status = "Active" LIMIT 1',
            [username]
        );

        if (userRows.length === 0) {
            return res.status(400).json({
                error: true,
                code: 101,
                message: 'Username is wrong'
            });
        }

        // Step 2: Check password correctness
        const [passRows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND password = ? AND status = "Active" LIMIT 1',
            [username, password]
        );

        if (passRows.length === 0) {
            return res.status(400).json({
                error: true,
                code: 102,
                message: 'Password is wrong'
            });
        }

        const userPassRow = passRows[0];

        // Step 3: Update device_uid if needed
        if (device_uid && !userPassRow.device_uid) {
            await connection.execute(
                'UPDATE users SET device_uid = ? WHERE user_id = ?',
                [device_uid, userPassRow.user_id]
            );
            userPassRow.device_uid = device_uid;
        }

        // Step 4: Device UID check
        if (device_uid && userPassRow.device_uid && device_uid !== userPassRow.device_uid) {
            return res.status(400).json({
                error: true,
                code: 103,
                message: "You can't login another device"
            });
        }

        // Get full user data with category name
        const [fullUserRows] = await connection.execute(`
            SELECT u.*, c.name AS category_name
            FROM users u
            LEFT JOIN category c 
                ON u.category_id = c.category_id 
                AND c.status = 'Active'
            WHERE u.username = ?
              AND u.password = ?
              AND u.status = 'Active'
            LIMIT 1
        `, [username, password]);

        if (fullUserRows.length === 0) {
            return res.status(400).json({
                error: true,
                code: 104,
                message: 'Invalid login details'
            });
        }

        const user = fullUserRows[0];
        user.user_id = parseInt(user.user_id);
        user.category_id = parseInt(user.category_id);

        res.json({
            error: false,
            code: 200,
            message: 'Login Successfully',
            data: user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: true,
            code: 500,
            message: 'Database query failed: ' + error.message
        });
    }
});

module.exports = router;