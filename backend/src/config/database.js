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
            // Generate unique session variable names for OUT params
            const sessionVars = outParamNames.map(
                (_, i) => `@out_${i}_${Date.now()}`
            );

            // Initialize session variables
            const initVars = sessionVars
                .map((v) => `SET ${v} = NULL`)
                .join('; ');
            await connection.query(initVars);

            // Build SQL with @var for OUT params, ? for IN params
            let varIndex = 0;
            const placeholders = params
                .map((p) => {
                    if (p === null || p === undefined) {
                        return sessionVars[varIndex++];
                    }
                    return '?';
                })
                .join(',');

            // Filter only IN params for values array
            const inParams = params.filter(
                (p) => p !== null && p !== undefined
            );

            // Execute procedure
            const sql = `CALL ${procedureName}(${placeholders})`;
            const [results] = await connection.query(sql, inParams);

            // Fetch OUT param values
            const selectVars = `SELECT ${sessionVars.map((v, i) => `${v} as ${outParamNames[i]}`).join(', ')}`;
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
    callProcedure
};
