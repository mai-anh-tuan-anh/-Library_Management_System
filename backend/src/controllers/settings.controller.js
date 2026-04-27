const { query } = require('../config/database');

const getSettings = async (req, res) => {
    try {
        const settings = await query(
            `SELECT setting_key, setting_value FROM system_settings`
        );

        const result = {};
        settings.forEach((row) => {
            result[row.setting_key] = row.setting_value;
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        console.log('Update settings request:', updates);

        for (const [key, value] of Object.entries(updates)) {
            const result = await query(
                `INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at)
                 VALUES (?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                 setting_value = VALUES(setting_value),
                 updated_at = NOW()`,
                [key, value]
            );
            console.log(
                `Updated ${key}:`,
                result.affectedRows,
                'rows affected'
            );
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật cài đặt thành công'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
