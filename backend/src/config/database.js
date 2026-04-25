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

// Call stored procedure with OUT parameters support
const callProcedure = async (
    procedureName,
    params = [],
    outParamNames = []
) => {
    let connection;
    try {
        // Get connection from pool
        connection = await pool.getConnection();

        // Check if we have OUT params that need special handling
        const hasOutParams = params.some((p) => p === null || p === undefined);

        if (hasOutParams && outParamNames.length > 0) {
            // Initialize session variables for OUT params
            const initVars = outParamNames
                .map((name) => `SET @${name} = NULL`)
                .join('; ');
            await connection.query(initVars);

            // Build placeholders - use @var for OUT params
            let paramIndex = 0;
            let outIndex = 0;
            const placeholders = params
                .map((p) => {
                    if (p === null || p === undefined) {
                        return `@${outParamNames[outIndex++]}`;
                    }
                    return '?';
                })
                .join(',');

            // Filter only IN params for the query
            const inParams = params.filter(
                (p) => p !== null && p !== undefined
            );

            // Execute procedure
            const sql = `CALL ${procedureName}(${placeholders})`;
            const [results] = await connection.query(sql, inParams);

            // Fetch OUT param values
            const selectVars = `SELECT ${outParamNames.map((name) => `@${name} as ${name}`).join(', ')}`;
            const [outResults] = await connection.query(selectVars);

            // Return combined results
            return [...(Array.isArray(results) ? results : []), outResults];
        } else {
            // No OUT params - simple call
            const placeholders = params.map(() => '?').join(',');
            const sql = `CALL ${procedureName}(${placeholders})`;
            const [results] = await connection.query(sql, params);
            return results;
        }
    } catch (error) {
        console.error(`Procedure ${procedureName} error:`, error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    pool,
    query,
    transaction,
    callProcedure,
    testConnection
};
