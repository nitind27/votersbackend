const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8'
};

let pool;

const connectDB = async () => {
    try {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        });
        console.log('Database pool created successfully');
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

const getConnection = () => {
    if (!pool) {
        throw new Error('Database pool not initialized');
    }
    return pool;
};

module.exports = {
    connectDB,
    getConnection
};