const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'national_library',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    multipleStatements: true
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Execute query helper
const query = async (sql, params) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Call stored procedure
const callProcedure = async (procedureName, params = []) => {
    try {
        const placeholders = params.map(() => '?').join(',');
        const sql = `CALL ${procedureName}(${placeholders})`;
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error(`Procedure ${procedureName} error:`, error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    transaction,
    callProcedure,
    testConnection
};
