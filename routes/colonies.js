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

// Fetch all colony entries with pagination and search - Accept form-data
router.post('/fetch-all-entries', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : null;
        const search = req.body.search ? req.body.search.trim() : '';
        const page = req.body.page && !isNaN(req.body.page) ? parseInt(req.body.page) : 1;
        const limit = req.body.limit && !isNaN(req.body.limit) ? parseInt(req.body.limit) : 30;
        const offset = (page - 1) * limit;

        // Process colony_id
        let colony_id_in = null;
        if (colony_id !== null) {
            const colony_ids_array = colony_id.split(',')
                .map(id => parseInt(id))
                .filter(id => id > 0);
            
            if (colony_ids_array.length === 0) {
                return res.status(400).json({
                    error: true,
                    message: 'Invalid colony_id'
                });
            }
            colony_id_in = colony_ids_array.join(',');
        }

        // Build WHERE clause
        const where_clauses = ["ce.status = 'Active'"];
        if (colony_id_in !== null) {
            where_clauses.push(`ce.colony_id IN (${colony_id_in})`);
        }
        const where_sql = where_clauses.join(' AND ');

        // Build search SQL - Fixed to match PHP exactly
        let search_sql = '';
        if (search !== '') {
            // For main query - can use all fields including primary_person_name_mr_new
            search_sql = ` AND (
                ce.house_number LIKE '%${search}%' OR
                primary_person_name LIKE '%${search}%' OR
                primary_person_name_mr_new LIKE '%${search}%' OR
                primary_person_mobile LIKE '%${search}%'
            )`;
        }

        // Primary person subquery
        const primaryPersonSql = `
            FROM voter_entry ve2
            WHERE ve2.colony_entry_id = ce.colony_entry_id
            AND ve2.relation = 'Primary Person'
            LIMIT 1
        `;

        // Main query
        const sql = `
            SELECT 
                ce.*, 
                COUNT(ve.voter_id) AS family_member,
                (
                    SELECT ve2.full_name 
                    ${primaryPersonSql}
                ) AS primary_person_name,
                (
                    SELECT ve2.full_name_mr 
                    ${primaryPersonSql}
                ) AS primary_person_name_mr,
                (
                    SELECT CONCAT(
                        COALESCE(NULLIF(TRIM(ve2.first_name_mr), ''), ve2.first_name), ' ',
                        COALESCE(NULLIF(TRIM(ve2.middle_name_mr), ''), ve2.middle_name), ' ',
                        COALESCE(NULLIF(TRIM(ve2.last_name_mr), ''), ve2.last_name)
                    )
                    ${primaryPersonSql}
                ) AS primary_person_name_mr_new,
                (
                    SELECT ve2.mobile 
                    ${primaryPersonSql}
                ) AS primary_person_mobile,
                (
                    SELECT ve2.photo 
                    ${primaryPersonSql}
                ) AS primary_person_photo
            FROM 
                colony_entry ce
            LEFT JOIN 
                voter_entry ve 
                ON ce.colony_entry_id = ve.colony_entry_id
            WHERE 
                ${where_sql}
            GROUP BY 
                ce.colony_entry_id
            HAVING 1 ${search_sql}
            ORDER BY
                ce.house_number ASC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [rows] = await connection.execute(sql);

        // Count query for pagination - EXACTLY like PHP code
        // For count query, we need different search logic since primary_person_name_mr_new is not available
        let count_search_sql = '';
        if (search !== '') {
            count_search_sql = ` AND (
                ce.house_number LIKE '%${search}%' OR
                primary_person_name LIKE '%${search}%' OR
                primary_person_mobile LIKE '%${search}%'
            )`;
        }

        const count_sql = `
            SELECT COUNT(*) AS total FROM (
                SELECT 
                    ce.colony_entry_id,
                    (
                        SELECT ve2.full_name 
                        ${primaryPersonSql}
                    ) AS primary_person_name,
                    (
                        SELECT ve2.full_name_mr 
                        ${primaryPersonSql}
                    ) AS primary_person_name_mr,
                    (
                        SELECT ve2.mobile 
                        ${primaryPersonSql}
                    ) AS primary_person_mobile,
                    ce.house_number
                FROM colony_entry ce
                WHERE ${where_sql}
                GROUP BY ce.colony_entry_id
                HAVING 1 ${count_search_sql}
            ) AS filtered_entries
        `;

        const [countRows] = await connection.execute(count_sql);
        const total = countRows[0] ? parseInt(countRows[0].total) : 0;

        // Convert string IDs to integers
        const response = rows.map(row => ({
            ...row,
            colony_entry_id: parseInt(row.colony_entry_id),
            colony_id: parseInt(row.colony_id),
            user_id: parseInt(row.user_id),
            family_member: parseInt(row.family_member)
        }));

        const hasMore = (page * limit) < total;

        res.json({
            page: page,
            limit: limit,
            total_records: total,
            has_more: hasMore,
            data: response
        });

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

        // Validation - exactly like PHP
        const colony_entry_id_num = parseInt(colony_entry_id);
        if (!colony_entry_id || isNaN(colony_entry_id_num) || colony_entry_id_num <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing colony_entry_id"
            });
        }

        // Fetch colony with voter count - EXACTLY like PHP
        const sql = `
            SELECT 
                ce.*, 
                COUNT(ve.voter_id) AS family_member
            FROM 
                colony_entry ce
            LEFT JOIN 
                voter_entry ve 
            ON 
                ce.colony_entry_id = ve.colony_entry_id
            WHERE 
                ce.colony_entry_id = ? 
                AND ce.status = 'Active'
            GROUP BY 
                ce.colony_entry_id
            LIMIT 1
        `;

        const [rows] = await connection.execute(sql, [colony_entry_id_num]);

        if (rows.length > 0) {
            const colony = rows[0];
            
            // Type casting for int fields - exactly like PHP
            colony.colony_id = parseInt(colony.colony_id);
            colony.colony_entry_id = parseInt(colony.colony_entry_id);
            colony.user_id = parseInt(colony.user_id);
            colony.family_member = parseInt(colony.family_member);

            res.json({
                success: true,
                data: colony
            });
        } else {
            res.json({
                success: false,
                message: "Colony not found"
            });
        }

    } catch (error) {
        console.error('Fetch colony entry by ID error:', error);
        res.status(500).json({
            success: false,
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

        // Validation - exactly like PHP
        const colony_id_num = parseInt(colony_id);
        if (!colony_id || isNaN(colony_id_num) || colony_id_num <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing colony_id"
            });
        }

        // Fetch all colony members for given colony_id with status='Active' - EXACTLY like PHP
        const sql = `SELECT * FROM colony_member WHERE colony_id IN (${colony_id_num}) AND status = 'Active'`;
        
        const [rows] = await connection.execute(sql);

        const colonyMembers = rows.map(row => {
            // Proper typecast for integer fields - exactly like PHP
            const member = { ...row };
            if (member.colony_member_id) member.colony_member_id = parseInt(member.colony_member_id);
            if (member.colony_id) member.colony_id = parseInt(member.colony_id);
            return member;
        });

        res.json({
            success: true,
            count: colonyMembers.length,
            data: colonyMembers
        });

    } catch (error) {
        console.error('Fetch colony members error:', error);
        res.status(500).json({
            success: false,
            message: "Database query failed"
        });
    }
});

// Fetch house voter count by colony - Accept form-data
router.post('/fetch-house-voter-count', async (req, res) => {
    const connection = getConnection();
    
    try {
        // Get data from form-data (req.body)
        const colony_id = req.body.colony_id ? req.body.colony_id.trim() : '';

        // Get colony_ids from POST parameter, sanitize and prepare for query - EXACTLY like PHP
        const ids_array = colony_id.split(',')
            .map(id => parseInt(id))
            .filter(id => id > 0);

        if (ids_array.length === 0) {
            return res.status(400).json({
                error: 'No valid colony IDs provided'
            });
        }

        const ids_string = ids_array.join(',');

        // SQL query to get colony_name, total voters, and house count by colony_id - EXACTLY like PHP
        const sql = `
            SELECT 
                c.colony_id,
                c.colony_name,
                COUNT(DISTINCT ce.house_number) AS total_house_count,
                COUNT(ve.voter_id) AS total_voter_count
            FROM colony c
            LEFT JOIN colony_entry ce ON c.colony_id = ce.colony_id AND ce.status = 'Active'
            LEFT JOIN voter_entry ve ON ce.colony_entry_id = ve.colony_entry_id AND ve.status = 'Active'
            WHERE c.colony_id IN (${ids_string}) AND c.status = 'Active'
            GROUP BY c.colony_id, c.colony_name
            ORDER BY c.colony_id DESC
        `;

        const [rows] = await connection.execute(sql);

        const response = rows.map(row => {
            // Type casting - exactly like PHP
            const result = { ...row };
            result.colony_id = parseInt(result.colony_id);
            // total_house_count and total_voter_count are already numbers from COUNT()
            return result;
        });

        res.json(response);

    } catch (error) {
        console.error('Fetch house voter count error:', error);
        res.status(500).json({
            error: 'Database query error'
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