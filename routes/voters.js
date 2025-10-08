const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getConnection } = require('../config/database');

// Configure multer for file uploads - EXACTLY like PHP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/voter_photos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use original filename like PHP - basename($_FILES['photo']['name'])
        cb(null, path.basename(file.originalname));
    }
});

// Multer configuration - accept any field name for photo
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
        files: 1 // Only allow 1 file
    },
    fileFilter: (req, file, cb) => {
        // Accept any file type like PHP
        cb(null, true);
    }
});

// Insert voter details - Accept form-data - EXACTLY like PHP
router.post('/insert', upload.single('photo'), async (req, res) => {
    const connection = getConnection();
    
    try {
        // Required fields validation - EXACTLY like PHP $_POST
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

        // Validate required fields
        if (!colony_entry_id || !first_name || !last_name || !voter_number) {
            return res.status(400).json({
                error: true,
                code: 400,
                message: 'Required fields missing: colony_entry_id, first_name, last_name, voter_number'
            });
        }

        // Create full names - EXACTLY like PHP
        // $full_name = trim($first_name . ' ' . $middle_name . ' ' . $last_name);
        // $full_name = preg_replace('/\s+/', ' ', $full_name);
        let full_name = [first_name, middle_name, last_name].join(' ').trim();
        full_name = full_name.replace(/\s+/g, ' ');
        
        let full_name_mr = [first_name_mr, middle_name_mr, last_name_mr].join(' ').trim();
        full_name_mr = full_name_mr.replace(/\s+/g, ' ');

        // Photo upload - EXACTLY like PHP
        // $photoName = '';
        // if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        let photoName = '';
        if (req.file && req.file.filename) {
            // $photoName = basename($_FILES['photo']['name']);
            photoName = path.basename(req.file.filename);
        }

        // Insert query - EXACTLY like PHP
        const query = `
            INSERT INTO voter_entry 
            (colony_entry_id, first_name, middle_name, last_name, full_name, 
             first_name_mr, middle_name_mr, last_name_mr, full_name_mr, 
             voter_number, gender, availability, relation, dob, aadhaar_number, 
             booth_number, photo, mobile, user_id, type_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await connection.execute(query, [
            colony_entry_id, first_name, middle_name, last_name, full_name,
            first_name_mr, middle_name_mr, last_name_mr, full_name_mr,
            voter_number, gender, availability, relation, dob, aadhaar_number,
            booth_number, photoName, mobile, user_id, type_status
        ]);

        // Response - EXACTLY like PHP
        res.json({
            error: false,
            message: 'Family member submitted successfully.',
            voter_id: result.insertId
        });

    } catch (error) {
        console.error('Insert voter error:', error);
        
        // If photo was uploaded but insert failed, delete the photo
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Failed to delete uploaded photo:', unlinkError);
            }
        }
        
        // Error response - EXACTLY like PHP
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
router.post('/delete', upload.none(), async (req, res) => {
    const pool = getConnection();
    const connection = await pool.getConnection(); // Get actual connection from pool
    
    try {
        // Get data from form-data (req.body) - Convert to string first
        const voter_id = req.body.voter_id ? String(req.body.voter_id).trim() : '';

        // Validate required field
        if (!voter_id) {
            connection.release(); // Release connection before returning
            return res.status(400).json({
                error: true,
                code: 400,
                message: 'voter_id is required'
            });
        }

        // Start transaction to ensure data consistency
        await connection.beginTransaction();

        try {
            // Get photo name before deletion
            const [photoRows] = await connection.execute(
                'SELECT photo FROM voter_entry WHERE voter_id = ?',
                [voter_id]
            );

            if (photoRows.length === 0) {
                await connection.rollback();
                connection.release(); // Release connection
                return res.status(404).json({
                    error: true,
                    code: 404,
                    message: 'Voter not found.'
                });
            }

            const photo = photoRows[0].photo;

            // Delete photo file first
            if (photo) {
                const photoPath = path.join(__dirname, '../uploads/voter_photos', photo);
                if (fs.existsSync(photoPath)) {
                    try {
                        fs.unlinkSync(photoPath);
                        console.log(`Photo deleted: ${photo}`);
                    } catch (unlinkError) {
                        console.error('Failed to delete photo file:', unlinkError);
                        // Continue with database deletion even if photo deletion fails
                    }
                }
            }

            // Delete record from database
            const [deleteResult] = await connection.execute(
                'DELETE FROM voter_entry WHERE voter_id = ?',
                [voter_id]
            );

            // Check if any rows were actually deleted
            if (deleteResult.affectedRows === 0) {
                await connection.rollback();
                connection.release(); // Release connection
                return res.status(404).json({
                    error: true,
                    code: 404,
                    message: 'Voter not found or already deleted.'
                });
            }

            // Commit transaction
            await connection.commit();
            connection.release(); // Release connection after successful commit
            
            res.json({
                error: false,
                message: 'Family member deleted successfully.',
                deletedRows: deleteResult.affectedRows
            });

        } catch (transactionError) {
            // Rollback transaction on any error
            await connection.rollback();
            connection.release(); // Release connection after rollback
            throw transactionError;
        }

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