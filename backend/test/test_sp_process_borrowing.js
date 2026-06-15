/**
 * TEST SCRIPT: Gọi sp_process_borrowing từ Node.js
 * 
 * Cách chạy:
 * 1. cd /c/xampp/htdocs/national_library/backend
 * 2. node test/test_sp_process_borrowing.js
 */

const { callProcedure } = require('../src/config/database');

// =====================================================
// INPUT DATA - Thay đổi theo nhu cầu của bạn
// =====================================================
const INPUT = {
    reader_id: 1,              // ID độc giả (lấy từ bảng readers)
    borrowed_by: 1,            // ID nhân viên tạo phiếu (lấy từ bảng users)
    payment_method_id: 1,      // 1: Tiền mặt, 2: Chuyển khoản
    notes: 'Mượn sách đọc tại nhà',  // Ghi chú tùy ý
    borrow_days: 14            // Số ngày mượn (mặc định 14, max tùy tier)
};

// =====================================================
// HÀM TEST
// =====================================================
async function testCreateBorrowing() {
    console.log('==========================================');
    console.log('TEST: sp_process_borrowing');
    console.log('==========================================');
    console.log('Input:', INPUT);
    console.log('');

    try {
        // Gọi procedure với OUT params
        const results = await callProcedure(
            'sp_process_borrowing',
            [
                INPUT.reader_id,
                INPUT.borrowed_by,
                INPUT.payment_method_id,
                INPUT.notes,
                INPUT.borrow_days,
                null,  // OUT p_transaction_id
                null,  // OUT p_success
                null   // OUT p_message
            ],
            ['p_transaction_id', 'p_success', 'p_message']  // Tên OUT params
        );

        console.log('------------------------------------------');
        console.log('RESULT:');
        console.log('------------------------------------------');

        // Xử lý kết quả
        if (results && results.length > 0) {
            const lastResult = results[results.length - 1];
            if (Array.isArray(lastResult) && lastResult.length > 0) {
                const result = lastResult[0];
                console.log('Transaction ID:', result.p_transaction_id);
                console.log('Success:', result.p_success);
                console.log('Message:', result.p_message);
                
                if (result.p_success) {
                    console.log('\n✅ Tạo phiếu mượn thành công!');
                    console.log(`Mã phiếu: BRW-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${INPUT.reader_id}-xxx`);
                } else {
                    console.log('\n❌ Tạo phiếu thất bại:', result.p_message);
                }
            } else {
                console.log('Raw results:', results);
            }
        } else {
            console.log('No results returned');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

// =====================================================
// VALIDATION HELPER - Kiểm tra trước khi gọi
// =====================================================
async function validateBeforeCall() {
    const { query } = require('../src/config/database');
    
    console.log('==========================================');
    console.log('VALIDATION: Kiểm tra điều kiện trước khi mượn');
    console.log('==========================================');

    try {
        // Kiểm tra độc giả
        const [reader] = await query(
            `SELECT r.reader_id, r.full_name, r.is_active, r.is_blacklisted, 
                    r.current_borrows, mt.tier_name, mt.max_books, mt.max_borrow_days
             FROM readers r
             JOIN membership_tiers mt ON r.tier_id = mt.tier_id
             WHERE r.reader_id = ?`,
            [INPUT.reader_id]
        );

        if (!reader) {
            console.error('❌ Độc giả không tồn tại (reader_id =', INPUT.reader_id, ')');
            return false;
        }

        console.log('Độc giả:', reader.full_name);
        console.log('  - Trạng thái:', reader.is_active ? 'Active' : 'INACTIVE ⚠️');
        console.log('  - Blacklist:', reader.is_blacklisted ? 'YES ⚠️' : 'No');
        console.log('  - Cấp thành viên:', reader.tier_name);
        console.log('  - Đang mượn:', reader.current_borrows, '/', reader.max_books);
        console.log('  - Có thể mượn thêm:', reader.max_books - reader.current_borrows);
        console.log('  - Max ngày mượn:', reader.max_borrow_days);

        // Kiểm tra số ngày mượn
        if (INPUT.borrow_days > reader.max_borrow_days) {
            console.error(`❌ Số ngày mượn (${INPUT.borrow_days}) vượt quá giới hạn (${reader.max_borrow_days})`);
            return false;
        }

        if (!reader.is_active) {
            console.error('❌ Độc giả không active');
            return false;
        }

        if (reader.is_blacklisted) {
            console.error('❌ Độc giả bị đưa vào danh sách đen');
            return false;
        }

        console.log('\n✅ Validation passed!');
        return true;

    } catch (error) {
        console.error('❌ Lỗi validation:', error.message);
        return false;
    }
}

// =====================================================
// MAIN
// =====================================================
(async () => {
    // Uncomment để chạy validation trước
    // const isValid = await validateBeforeCall();
    // if (!isValid) process.exit(1);

    await testCreateBorrowing();
})();
