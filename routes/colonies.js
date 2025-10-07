const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Fetch all colonies
router.get('/fetch-all', async (req, res) => {
    const connection = getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM colony WHERE status = "Active"'
        );

        const response = rows.map(row => ({
            ...row,
            colony_id: parseInt(row.colony_id)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch colonies error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Insert colony entry - Accept form-data
router.post('/insert-entry', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';
        const house_number = req.body.house_number ? req.body.house_number.trim() : '';
        const user_id = req.body.user_id ? req.body.user_id.trim() : '';

        if (!colony_id || !house_number) {
            return res.status(400).json({
                error: true,
                code: 400,
                message: 'All fields are required.'
            });
        }

        const [result] = await connection.execute(`
            INSERT INTO colony_entry (colony_id, house_number, user_id, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        `, [colony_id, house_number, user_id]);

        res.json({
            error: false,
            message: 'Family members submitted successfully.',
            colony_entry_id: result.insertId
        });

    } catch (error) {
        console.error('Insert colony entry error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

// Fetch all colony entries
router.get('/fetch-all-entries', async (req, res) => {
    const connection = getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM colony_entry WHERE status = "Active"'
        );

        const response = rows.map(row => ({
            ...row,
            colony_entry_id: parseInt(row.colony_entry_id),
            colony_id: parseInt(row.colony_id),
            user_id: parseInt(row.user_id)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch colony entries error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Fetch colony entry by ID - Accept form-data
router.post('/fetch-entry-by-id', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';

        const [rows] = await connection.execute(`
            SELECT ce.*, c.name as colony_name 
            FROM colony_entry ce 
            LEFT JOIN colony c ON ce.colony_id = c.colony_id 
            WHERE ce.colony_entry_id = ? AND ce.status = "Active"
        `, [colony_entry_id]);

        if (rows.length === 0) {
            return res.status(404).json({
                error: true,
                code: 404,
                message: 'Colony entry not found'
            });
        }

        const entry = rows[0];
        entry.colony_entry_id = parseInt(entry.colony_entry_id);
        entry.colony_id = parseInt(entry.colony_id);
        entry.user_id = parseInt(entry.user_id);

        res.json({
            error: false,
            data: entry
        });

    } catch (error) {
        console.error('Fetch colony entry by ID error:', error);
        res.status(500).json({
            error: true,
            code: 500,
            message: error.message
        });
    }
});

// Fetch voters by colony entry ID - Accept form-data
router.post('/fetch-voters-by-entry-id', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';

        const [rows] = await connection.execute(
            'SELECT * FROM voter_entry WHERE colony_entry_id = ? AND status = "Active"',
            [colony_entry_id]
        );

        const response = rows.map(row => ({
            ...row,
            voter_id: parseInt(row.voter_id),
            colony_entry_id: parseInt(row.colony_entry_id),
            user_id: parseInt(row.user_id)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch voters by colony entry ID error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Fetch colony members by colony ID - Accept form-data
router.post('/fetch-members-by-colony-id', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';

        const [rows] = await connection.execute(`
            SELECT ce.*, c.name as colony_name 
            FROM colony_entry ce 
            LEFT JOIN colony c ON ce.colony_id = c.colony_id 
            WHERE ce.colony_id = ? AND ce.status = "Active"
        `, [colony_id]);

        const response = rows.map(row => ({
            ...row,
            colony_entry_id: parseInt(row.colony_entry_id),
            colony_id: parseInt(row.colony_id),
            user_id: parseInt(row.user_id)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch colony members error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Fetch house voter count by colony - Accept form-data
router.post('/fetch-house-voter-count', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';

        const [rows] = await connection.execute(`
            SELECT 
                ce.colony_entry_id,
                ce.house_number,
                COUNT(ve.voter_id) as voter_count
            FROM colony_entry ce
            LEFT JOIN voter_entry ve ON ce.colony_entry_id = ve.colony_entry_id AND ve.status = 'Active'
            WHERE ce.colony_id = ? AND ce.status = 'Active'
            GROUP BY ce.colony_entry_id, ce.house_number
            ORDER BY ce.house_number
        `, [colony_id]);

        const response = rows.map(row => ({
            ...row,
            colony_entry_id: parseInt(row.colony_entry_id),
            voter_count: parseInt(row.voter_count)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch house voter count error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Update colony entry - Accept form-data
router.post('/update-entry', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';
        const house_number = req.body.house_number ? req.body.house_number.trim() : '';
        const user_id = req.body.user_id ? req.body.user_id.trim() : '';

        if (!colony_entry_id || !colony_id || !house_number) {
            return res.status(400).json({
                error: true,
                code: 400,
                message: 'All fields are required.'
            });
        }

        await connection.execute(`
            UPDATE colony_entry SET 
            colony_id = ?, house_number = ?, user_id = ?, updated_at = NOW()
            WHERE colony_entry_id = ?
        `, [colony_id, house_number, user_id, colony_entry_id]);

        res.json({
            error: false,
            message: 'Colony entry updated successfully.'
        });

    } catch (error) {
        console.error('Update colony entry error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

// Delete colony entry - Accept form-data
router.post('/delete-entry', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';

        // First delete all voters in this colony entry
        await connection.execute(
            'DELETE FROM voter_entry WHERE colony_entry_id = ?',
            [colony_entry_id]
        );

        // Then delete the colony entry
        await connection.execute(
            'DELETE FROM colony_entry WHERE colony_entry_id = ?',
            [colony_entry_id]
        );

        res.json({
            error: false,
            message: 'Colony entry deleted successfully.'
        });

    } catch (error) {
        console.error('Delete colony entry error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

module.exports = router;