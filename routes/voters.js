const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getConnection } = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/voter_photos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }
});

// Insert voter details - Accept form-data
router.post('/insert', upload.single('photo'), async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';
        const first_name = req.body.first_name ? req.body.first_name.trim() : '';
        const middle_name = req.body.middle_name ? req.body.middle_name.trim() : '';
        const last_name = req.body.last_name ? req.body.last_name.trim() : '';
        const first_name_mr = req.body.first_name_mr ? req.body.first_name_mr.trim() : '';
        const middle_name_mr = req.body.middle_name_mr ? req.body.middle_name_mr.trim() : '';
        const last_name_mr = req.body.last_name_mr ? req.body.last_name_mr.trim() : '';
        const voter_number = req.body.voter_number ? req.body.voter_number.trim() : '';
        const gender = req.body.gender ? req.body.gender.trim() : '';
        const availability = req.body.availability ? req.body.availability.trim() : '';
        const relation = req.body.relation ? req.body.relation.trim() : '';
        const dob = req.body.dob ? req.body.dob.trim() : '';
        const aadhaar_number = req.body.aadhaar_number ? req.body.aadhaar_number.trim() : '';
        const booth_number = req.body.booth_number ? req.body.booth_number.trim() : '';
        const mobile = req.body.mobile ? req.body.mobile.trim() : '';
        const user_id = req.body.user_id ? req.body.user_id.trim() : '';
        const type_status = req.body.type_status ? req.body.type_status.trim() : '';

        // Create full names
        const full_name = [first_name, middle_name, last_name].filter(Boolean).join(' ');
        const full_name_mr = [first_name_mr, middle_name_mr, last_name_mr].filter(Boolean).join(' ');

        // Handle photo upload
        const photoName = req.file ? req.file.filename : '';

        const [result] = await connection.execute(`
            INSERT INTO voter_entry 
            (colony_entry_id, first_name, middle_name, last_name, full_name, 
             first_name_mr, middle_name_mr, last_name_mr, full_name_mr, 
             voter_number, gender, availability, relation, dob, aadhaar_number, 
             booth_number, photo, mobile, user_id, type_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            colony_entry_id, first_name, middle_name, last_name, full_name,
            first_name_mr, middle_name_mr, last_name_mr, full_name_mr,
            voter_number, gender, availability, relation, dob, aadhaar_number,
            booth_number, photoName, mobile, user_id, type_status
        ]);

        res.json({
            error: false,
            message: 'Family member submitted successfully.',
            voter_id: result.insertId
        });

    } catch (error) {
        console.error('Insert voter error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

// Fetch all voter entries - Accept form-data
router.post('/fetch-all', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';

        if (!colony_id) {
            return res.status(400).json({
                error: true,
                message: 'colony_id is required'
            });
        }

        // Get colony entry IDs
        const [colonyEntries] = await connection.execute(
            'SELECT colony_entry_id FROM colony_entry WHERE colony_id IN (?) AND status = "Active"',
            [colony_id]
        );

        const ids = colonyEntries.map(row => row.colony_entry_id);
        
        if (ids.length === 0) {
            return res.json([]);
        }

        const placeholders = ids.map(() => '?').join(',');
        const [voters] = await connection.execute(
            `SELECT * FROM voter_entry WHERE colony_entry_id IN (${placeholders}) AND status = "Active"`,
            ids
        );

        // Convert string IDs to integers
        const response = voters.map(row => ({
            ...row,
            voter_id: parseInt(row.voter_id),
            colony_entry_id: parseInt(row.colony_entry_id),
            user_id: parseInt(row.user_id)
        }));

        res.json(response);

    } catch (error) {
        console.error('Fetch voters error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

// Update voter details - Accept form-data
router.post('/update', upload.single('photo'), async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const voter_id = req.body.voter_id ? req.body.voter_id.trim() : '';
        const colony_entry_id = req.body.colony_entry_id ? req.body.colony_entry_id.trim() : '';
        const first_name = req.body.first_name ? req.body.first_name.trim() : '';
        const middle_name = req.body.middle_name ? req.body.middle_name.trim() : '';
        const last_name = req.body.last_name ? req.body.last_name.trim() : '';
        const first_name_mr = req.body.first_name_mr ? req.body.first_name_mr.trim() : '';
        const middle_name_mr = req.body.middle_name_mr ? req.body.middle_name_mr.trim() : '';
        const last_name_mr = req.body.last_name_mr ? req.body.last_name_mr.trim() : '';
        const voter_number = req.body.voter_number ? req.body.voter_number.trim() : '';
        const gender = req.body.gender ? req.body.gender.trim() : '';
        const availability = req.body.availability ? req.body.availability.trim() : '';
        const relation = req.body.relation ? req.body.relation.trim() : '';
        const dob = req.body.dob ? req.body.dob.trim() : '';
        const aadhaar_number = req.body.aadhaar_number ? req.body.aadhaar_number.trim() : '';
        const booth_number = req.body.booth_number ? req.body.booth_number.trim() : '';
        const mobile = req.body.mobile ? req.body.mobile.trim() : '';
        const user_id = req.body.user_id ? req.body.user_id.trim() : '';
        const type_status = req.body.type_status ? req.body.type_status.trim() : '';

        // Create full names
        const full_name = [first_name, middle_name, last_name].filter(Boolean).join(' ');
        const full_name_mr = [first_name_mr, middle_name_mr, last_name_mr].filter(Boolean).join(' ');

        // Get old photo name
        const [oldPhotoRows] = await connection.execute(
            'SELECT photo FROM voter_entry WHERE voter_id = ?',
            [voter_id]
        );

        let newPhotoName = oldPhotoRows[0]?.photo || '';

        // Handle new photo upload
        if (req.file) {
            const uploadedPhotoName = req.file.filename;
            
            // If name differs, delete old photo and use new one
            if (uploadedPhotoName !== newPhotoName) {
                if (newPhotoName) {
                    const oldPhotoPath = path.join(__dirname, '../uploads/voter_photos', newPhotoName);
                    if (fs.existsSync(oldPhotoPath)) {
                        fs.unlinkSync(oldPhotoPath);
                    }
                }
                newPhotoName = uploadedPhotoName;
            }
        }

        await connection.execute(`
            UPDATE voter_entry SET 
            colony_entry_id=?, first_name=?, middle_name=?, last_name=?, full_name=?, 
            first_name_mr=?, middle_name_mr=?, last_name_mr=?, full_name_mr=?, 
            voter_number=?, gender=?, availability=?, relation=?, dob=?, 
            aadhaar_number=?, booth_number=?, photo=?, mobile=?, user_id=?, 
            type_status=?, updated_at=NOW() 
            WHERE voter_id=?
        `, [
            colony_entry_id, first_name, middle_name, last_name, full_name,
            first_name_mr, middle_name_mr, last_name_mr, full_name_mr,
            voter_number, gender, availability, relation, dob, aadhaar_number,
            booth_number, newPhotoName, mobile, user_id, type_status, voter_id
        ]);

        res.json({
            error: false,
            message: 'Family member updated successfully.'
        });

    } catch (error) {
        console.error('Update voter error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

// Delete voter details - Accept form-data
router.post('/delete', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const voter_id = req.body.voter_id ? req.body.voter_id.trim() : '';

        // Get photo name before deletion
        const [photoRows] = await connection.execute(
            'SELECT photo FROM voter_entry WHERE voter_id = ?',
            [voter_id]
        );

        if (photoRows.length === 0) {
            return res.status(404).json({
                error: true,
                code: 404,
                message: 'Voter not found.'
            });
        }

        const photo = photoRows[0].photo;

        // Delete photo file
        if (photo) {
            const photoPath = path.join(__dirname, '../uploads/voter_photos', photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Delete record
        await connection.execute(
            'DELETE FROM voter_entry WHERE voter_id = ?',
            [voter_id]
        );

        res.json({
            error: false,
            message: 'Family member deleted successfully.'
        });

    } catch (error) {
        console.error('Delete voter error:', error);
        res.status(500).json({
            error: true,
            code: error.code || 500,
            message: error.message
        });
    }
});

// Fetch voter by ID - Accept form-data
router.post('/fetch-by-id', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const voter_id = req.body.voter_id ? req.body.voter_id.trim() : '';

        const [rows] = await connection.execute(
            'SELECT * FROM voter_entry WHERE voter_id = ? AND status = "Active"',
            [voter_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: true,
                code: 404,
                message: 'Voter not found'
            });
        }

        const voter = rows[0];
        voter.voter_id = parseInt(voter.voter_id);
        voter.colony_entry_id = parseInt(voter.colony_entry_id);
        voter.user_id = parseInt(voter.user_id);

        res.json({
            error: false,
            data: voter
        });

    } catch (error) {
        console.error('Fetch voter by ID error:', error);
        res.status(500).json({
            error: true,
            code: 500,
            message: error.message
        });
    }
});

module.exports = router;