import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RiAddLine,
    RiEyeLine,
    RiExchangeLine,
    RiCalendarLine,
    RiMoneyDollarCircleLine,
    RiUserLine,
    RiBookLine,
    RiSearchLine
} from 'react-icons/ri';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import borrowService from '../../services/borrowService';
import settingsService from '../../services/settingsService';

const getStatusBadge = (status) => {
    const styles = {
        active: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-gray-100 text-gray-800'
    };
    const labels = {
        active: 'Đang mượn',
        completed: 'Đã hoàn thành',
        cancelled: 'Đã hủy'
    };
    return (
        <span className={`badge ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
};

const Borrowing = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Search and filter states
    const [searchKeyword, setSearchKeyword] = useState('');
    const [borrowDateFilter, setBorrowDateFilter] = useState('');
    const [transactionBooks, setTransactionBooks] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Return book modal states
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedBookForReturn, setSelectedBookForReturn] = useState(null);
    const [returnFormData, setReturnFormData] = useState({
        condition_on_return: 'good',
        damage_type_id: null,
        damage_description: '',
        fine_payment_method_id: 1,
        calculated_late_fee: 0,
        calculated_damage_fee: 0,
        days_late: 0
    });
    const [processingReturn, setProcessingReturn] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        loadTransactions();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsService.getSettings();
            setSettings(response.data || {});
        } catch (error) {
            console.error('Failed to load settings');
        }
    };

    const loadTransactions = async () => {
        try {
            const response = await borrowService.getAll();
            setTransactions(response.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách phiếu mượn');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
        setLoadingDetail(true);

        try {
            const response = await borrowService.getById(
                transaction.transaction_id
            );
            const data = response.data;
            // Update selectedTransaction with full data from API
            setSelectedTransaction({
                ...transaction,
                ...data,
                total_fee: data.total_fee
            });
            setTransactionBooks(data?.books || []);
        } catch (error) {
            toast.error('Không thể tải chi tiết phiếu mượn');
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
        setTransactionBooks([]);
    };

    // Return book modal handlers
    const openReturnModal = async (book) => {
        setSelectedBookForReturn(book);

        // Use late_fee from backend API response
        let daysLate = 0;
        let lateFee = 0;

        // Use days_overdue from backend if available
        if (book.days_overdue !== undefined && book.days_overdue !== null) {
            daysLate = parseInt(book.days_overdue);
        } else if (
            book.total_days_overdue !== undefined &&
            book.total_days_overdue !== null
        ) {
            // Use from transaction summary
            daysLate = parseInt(book.total_days_overdue);
        }

        // Prioritize late_fee from API response
        if (book.late_fee !== undefined && book.late_fee !== null) {
            lateFee = parseFloat(book.late_fee);
        } else if (
            book.estimated_fine !== undefined &&
            book.estimated_fine !== null
        ) {
            lateFee = parseFloat(book.estimated_fine);
        }

        // If still no daysLate, fetch from API
        if (daysLate === 0 && !book.days_overdue && !book.total_days_overdue) {
            try {
                const response = await borrowService.getById(
                    book.transaction_id
                );
                const bookDetails = response.data?.books?.find(
                    (b) => b.detail_id === book.detail_id
                );
                if (bookDetails && bookDetails.days_overdue !== undefined) {
                    daysLate = parseInt(bookDetails.days_overdue);
                }
                // Use late_fee from API if available
                if (
                    bookDetails &&
                    bookDetails.late_fee !== undefined &&
                    lateFee === 0
                ) {
                    lateFee = parseFloat(bookDetails.late_fee);
                }
            } catch (error) {
                console.error(
                    'Failed to fetch book details for late fee calculation'
                );
            }
        }

        // Calculate late fee based on daysLate using settings.late_penalty_percent (default 25%)
        // Only calculate if not already provided by API
        if (daysLate > 0 && lateFee === 0) {
            const penaltyPercent = (settings?.late_penalty_percent || 25) / 100;
            lateFee = (book.price || 0) * penaltyPercent * daysLate;
        }

        setReturnFormData({
            ...returnFormData,
            condition_on_return: 'good',
            damage_type_id: null,
            damage_description: '',
            fine_payment_method_id: 1,
            calculated_late_fee: lateFee,
            calculated_damage_fee: 0,
            days_late: daysLate
        });
        setShowReturnModal(true);
    };

    const closeReturnModal = () => {
        setShowReturnModal(false);
        setSelectedBookForReturn(null);
        setReturnFormData({
            condition_on_return: 'good',
            damage_type_id: null,
            damage_description: '',
            fine_payment_method_id: 1,
            calculated_late_fee: 0,
            calculated_damage_fee: 0,
            days_late: 0
        });
    };

    // Calculate damage/lost fine based on condition
    const calculateDamageFine = (
        condition,
        bookPrice,
        daysLate,
        currentLateFee
    ) => {
        const price = bookPrice || 0;
        let damageFee = 0;

        switch (condition) {
            case 'fair': // Hư hỏng nhẹ
                damageFee = Math.round(price * 0.3);
                break;
            case 'poor': // Hư hỏng nặng
                damageFee = Math.round(price * 0.7);
                break;
            case 'lost': // Mất
                damageFee = price; // 100%
                break;
            default:
                damageFee = 0;
        }

        // If lost: no late fee (only lost fee)
        // If damaged: add late fee
        const lateFee = condition === 'lost' ? 0 : currentLateFee;

        return { damageFee, lateFee };
    };

    const handleReturnSubmit = async () => {
        if (!selectedBookForReturn) return;

        setProcessingReturn(true);
        try {
            const response = await borrowService.returnBook({
                detail_id: selectedBookForReturn.detail_id,
                condition_on_return: returnFormData.condition_on_return,
                damage_type_id: returnFormData.damage_type_id,
                damage_description: returnFormData.damage_description,
                fine_payment_method_id: returnFormData.fine_payment_method_id
            });

            if (response.success) {
                toast.success('Trả sách thành công');
                closeReturnModal();

                // Refresh transaction details
                const updatedResponse = await borrowService.getById(
                    selectedTransaction.transaction_id
                );
                const updatedBooks = updatedResponse.data?.books || [];
                setTransactionBooks(updatedBooks);

                // Check if all books are returned
                const unreturnedBooks = updatedBooks.filter(
                    (book) => !book.returned && !book.actual_return_date
                );
                if (
                    unreturnedBooks.length === 0 &&
                    selectedTransaction.status === 'active'
                ) {
                    // All books returned, update transaction status
                    toast.success(
                        'Tất cả sách đã được trả. Phiếu mượn đã hoàn thành!'
                    );
                    // Success - close modal and refresh
                    setShowReturnModal(false);
                    setReturnFormData({
                        condition_on_return: 'good',
                        damage_type_id: null,
                        damage_description: '',
                        fine_payment_method_id: 1,
                        calculated_late_fee: 0,
                        calculated_damage_fee: 0,
                        days_late: 0
                    });
                    loadTransactions();
                    // Reload detail view if still open
                    if (
                        selectedTransaction &&
                        selectedTransaction.transaction_id
                    ) {
                        handleViewDetails(selectedTransaction);
                    }
                    toast.success(
                        response.data.message || 'Trả sách thành công'
                    );
                }
            } else {
                toast.error(response.message || 'Trả sách thất bại');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Trả sách thất bại');
        } finally {
            setProcessingReturn(false);
        }
    };

    // Calculate individual book due date based on borrow_days
    const calculateBookDueDate = (borrowDate, borrowDays) => {
        const date = new Date(borrowDate);
        date.setDate(date.getDate() + borrowDays);
        return date.toLocaleDateString('vi-VN');
    };

    // Check if book is overdue
    const isBookOverdue = (borrowDate, borrowDays) => {
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + borrowDays);
        return new Date() > dueDate;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    // Helper function to calculate book urgency using backend data
    const getBookUrgency = (book) => {
        // Use days_overdue from backend if available
        if (book.days_overdue !== undefined && book.days_overdue !== null) {
            const daysOverdue = parseInt(book.days_overdue);
            if (daysOverdue > 0) {
                return {
                    text: `Quá hạn ${daysOverdue} ngày`,
                    class: 'bg-red-100 text-red-700'
                };
            }
        }

        // Fallback: calculate from due_date
        if (book.due_date) {
            const dueDate = new Date(book.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            const daysRemaining = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            if (daysRemaining < 0) {
                return {
                    text: `Quá hạn ${Math.abs(daysRemaining)} ngày`,
                    class: 'bg-red-100 text-red-700'
                };
            } else if (daysRemaining === 0) {
                return {
                    text: 'Hôm nay',
                    class: 'bg-orange-100 text-orange-700'
                };
            } else if (daysRemaining <= 2) {
                return { text: 'Gấp', class: 'bg-orange-100 text-orange-700' };
            } else {
                return {
                    text: 'Còn hạn',
                    class: 'bg-green-100 text-green-700'
                };
            }
        }

        // Fallback to old method
        const borrowDate = new Date(selectedTransaction?.borrow_date);
        borrowDate.setDate(borrowDate.getDate() + book.borrow_days);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        borrowDate.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil(
            (borrowDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining < 0) {
            return {
                text: `Quá hạn ${Math.abs(daysRemaining)} ngày`,
                class: 'bg-red-100 text-red-700'
            };
        } else if (daysRemaining === 0) {
            return { text: 'Hôm nay', class: 'bg-orange-100 text-orange-700' };
        } else if (daysRemaining <= 2) {
            return { text: 'Gấp', class: 'bg-orange-100 text-orange-700' };
        } else {
            return { text: 'Còn hạn', class: 'bg-green-100 text-green-700' };
        }
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
        );
    }

    // Filter transactions
    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch =
            !searchKeyword ||
            t.transaction_code
                ?.toLowerCase()
                .includes(searchKeyword.toLowerCase()) ||
            t.reader_name
                ?.toLowerCase()
                .includes(searchKeyword.toLowerCase()) ||
            t.reader_code?.toLowerCase().includes(searchKeyword.toLowerCase());
        const matchesDate =
            !borrowDateFilter ||
            t.borrow_date?.split('T')[0] === borrowDateFilter;
        return matchesSearch && matchesDate;
    });

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        Quản lý Mượn sách / Trả sách
                    </h1>
                    <p className='text-gray-500 mt-1'>
                        Danh sách phiếu mượn và xử lý mượn/trả
                    </p>
                </div>
                <button
                    onClick={() => navigate('/borrowing/new')}
                    className='btn-primary gap-2'
                >
                    <RiAddLine className='w-5 h-5' />
                    Tạo phiếu mượn mới
                </button>
            </div>

            {/* Search and Filter */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                    <RiSearchLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                        type='text'
                        placeholder='Tìm theo mã phiếu, tên độc giả...'
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <RiCalendarLine className='w-5 h-5 text-gray-400' />
                    <input
                        type='date'
                        value={borrowDateFilter}
                        onChange={(e) => setBorrowDateFilter(e.target.value)}
                        className='px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    {borrowDateFilter && (
                        <button
                            onClick={() => setBorrowDateFilter('')}
                            className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                            <RiExchangeLine className='w-5 h-5 text-blue-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {
                                    transactions.filter(
                                        (t) => t.status === 'active'
                                    ).length
                                }
                            </p>
                            <p className='text-sm text-gray-500'>Đang mượn</p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <RiCalendarLine className='w-5 h-5 text-green-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {
                                    transactions.filter(
                                        (t) =>
                                            new Date(t.expected_return_date) <
                                                new Date() &&
                                            t.status === 'active'
                                    ).length
                                }
                            </p>
                            <p className='text-sm text-gray-500'>Quá hạn</p>
                        </div>
                    </div>
                </div>

                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-yellow-100 rounded-lg'>
                            <RiExchangeLine className='w-5 h-5 text-yellow-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {transactions.length}
                            </p>
                            <p className='text-sm text-gray-500'>Tổng phiếu</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className='card overflow-x-auto'>
                <table className='min-w-[900px] w-full'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='table-header'>Mã phiếu</th>
                            <th className='table-header'>Độc giả</th>
                            <th className='table-header'>Số sách</th>
                            <th className='table-header'>Ngày mượn</th>
                            <th className='table-header'>Hạn trả</th>
                            <th className='table-header'>Phí mượn</th>
                            <th className='table-header'>Trạng thái</th>
                            <th className='table-header'>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan='8'
                                    className='px-6 py-12 text-center text-gray-500'
                                >
                                    {searchKeyword || borrowDateFilter
                                        ? 'Không tìm thấy phiếu mượn phù hợp'
                                        : 'Chưa có phiếu mượn nào'}
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <tr
                                    key={transaction.transaction_id}
                                    className='hover:bg-gray-50'
                                >
                                    <td className='table-cell font-mono font-medium'>
                                        {transaction.transaction_code}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <RiUserLine className='w-4 h-4 text-gray-400' />
                                            {transaction.reader_name}
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-blue-100 text-blue-800'>
                                            {transaction.total_books} cuốn
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        {format(
                                            new Date(transaction.borrow_date),
                                            'dd/MM/yyyy HH:mm',
                                            { locale: vi }
                                        )}
                                    </td>
                                    <td className='table-cell'>
                                        {format(
                                            new Date(
                                                transaction.expected_return_date
                                            ),
                                            'dd/MM/yyyy',
                                            { locale: vi }
                                        )}
                                    </td>
                                    <td className='table-cell font-medium'>
                                        {formatCurrency(transaction.borrow_fee)}
                                    </td>
                                    <td className='table-cell'>
                                        {getStatusBadge(transaction.status)}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={() =>
                                                    handleViewDetails(
                                                        transaction
                                                    )
                                                }
                                                className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg'
                                            >
                                                <RiEyeLine className='w-5 h-5' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Transaction Detail Modal */}
            {showDetailModal && selectedTransaction && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4'>
                    <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl'>
                        <div className='p-6 border-b border-gray-100'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h2 className='text-xl font-bold text-gray-900'>
                                        Chi tiết phiếu mượn
                                    </h2>
                                    <p className='text-sm text-gray-500 mt-1'>
                                        {selectedTransaction.transaction_code} ·{' '}
                                        {selectedTransaction.reader_name}
                                    </p>
                                </div>
                                <button
                                    onClick={closeDetailModal}
                                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                >
                                    <span className='text-gray-500'>✕</span>
                                </button>
                            </div>
                        </div>

                        <div className='p-6 overflow-y-auto max-h-[60vh]'>
                            {loadingDetail ? (
                                <div className='flex items-center justify-center py-12'>
                                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
                                </div>
                            ) : transactionBooks.length === 0 ? (
                                <div className='text-center py-12 text-gray-500'>
                                    Không có thông tin chi tiết
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    {/* Summary Info */}
                                    <div className='grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl'>
                                        <div>
                                            <p className='text-xs text-gray-500'>
                                                Tổng sách
                                            </p>
                                            <p className='text-lg font-semibold'>
                                                {transactionBooks.length} cuốn
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-gray-500'>
                                                Hạn trả chung
                                            </p>
                                            <p className='text-lg font-semibold'>
                                                {new Date(
                                                    selectedTransaction.expected_return_date
                                                ).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-gray-500'>
                                                Tổng phí
                                            </p>
                                            <p className='text-lg font-semibold text-primary-600'>
                                                {formatCurrency(
                                                    selectedTransaction.total_fee
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Books Table */}
                                    <table className='w-full'>
                                        <thead>
                                            <tr className='text-left border-b border-gray-100'>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Sách
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Barcode
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Số ngày
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Hạn trả riêng
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Phí
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Trạng thái
                                                </th>
                                                <th className='pb-3 text-sm font-medium text-gray-500'>
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactionBooks.map((book) => {
                                                const bookDueDate =
                                                    calculateBookDueDate(
                                                        selectedTransaction.borrow_date,
                                                        book.borrow_days
                                                    );
                                                const isOverdue = isBookOverdue(
                                                    selectedTransaction.borrow_date,
                                                    book.borrow_days
                                                );
                                                const urgency =
                                                    getBookUrgency(book);

                                                console.log(
                                                    'Book:',
                                                    book.barcode,
                                                    'status:',
                                                    book.status,
                                                    'actual_return_date:',
                                                    book.actual_return_date
                                                );
                                                return (
                                                    <tr
                                                        key={book.detail_id}
                                                        className='border-b border-gray-50'
                                                    >
                                                        <td className='py-3'>
                                                            <div className='font-medium text-gray-900'>
                                                                {book.book_title ||
                                                                    book.title}
                                                            </div>
                                                        </td>
                                                        <td className='py-3 text-sm text-gray-500'>
                                                            {book.barcode}
                                                        </td>
                                                        <td className='py-3 text-sm'>
                                                            {book.borrow_days}{' '}
                                                            ngày
                                                        </td>
                                                        <td className='py-3'>
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                                    isOverdue
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                }`}
                                                            >
                                                                {bookDueDate}
                                                                {isOverdue &&
                                                                    '⚠'}
                                                            </span>
                                                        </td>
                                                        <td className='py-3 font-medium'>
                                                            {formatCurrency(
                                                                book.subtotal
                                                            )}
                                                        </td>
                                                        <td className='py-3'>
                                                            {book.status ===
                                                                'returned' ||
                                                            book.actual_return_date ? (
                                                                <span className='inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                                                                    Đã trả
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${urgency.class}`}
                                                                >
                                                                    {
                                                                        urgency.text
                                                                    }
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className='py-3'>
                                                            {book.status !==
                                                                'returned' &&
                                                                !book.actual_return_date && (
                                                                    <button
                                                                        onClick={() =>
                                                                            openReturnModal(
                                                                                book
                                                                            )
                                                                        }
                                                                        className='px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors'
                                                                    >
                                                                        Trả sách
                                                                    </button>
                                                                )}
                                                            {(book.status ===
                                                                'returned' ||
                                                                book.actual_return_date) && (
                                                                <span className='text-xs text-gray-400'>
                                                                    Đã trả
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className='p-6 border-t border-gray-100 bg-gray-50'>
                            <div className='flex justify-end gap-3'>
                                <button
                                    onClick={closeDetailModal}
                                    className='px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors'
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Book Modal */}
            {showReturnModal && selectedBookForReturn && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto'>
                    <div className='bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col'>
                        <div className='p-6 border-b border-gray-100 shrink-0'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-gray-900'>
                                    Trả sách
                                </h2>
                                <button
                                    onClick={closeReturnModal}
                                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                >
                                    <span className='text-gray-500'>✕</span>
                                </button>
                            </div>
                            <p className='text-sm text-gray-500 mt-1'>
                                {selectedBookForReturn.book_title ||
                                    selectedBookForReturn.title}
                            </p>
                        </div>

                        <div className='p-6 space-y-4 overflow-y-auto'>
                            {/* Book Info */}
                            <div className='p-4 bg-gray-50 rounded-lg space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-500'>
                                        Barcode:
                                    </span>
                                    <span className='font-medium'>
                                        {selectedBookForReturn.barcode}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-500'>
                                        Hạn trả:
                                    </span>
                                    <span className='font-medium'>
                                        {calculateBookDueDate(
                                            selectedTransaction.borrow_date,
                                            selectedBookForReturn.borrow_days
                                        )}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-500'>
                                        Phí mượn:
                                    </span>
                                    <span className='font-medium'>
                                        {formatCurrency(
                                            selectedBookForReturn.subtotal
                                        )}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-500'>
                                        Giá sách:
                                    </span>
                                    <span className='font-medium'>
                                        {formatCurrency(
                                            selectedBookForReturn.price
                                        )}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='text-gray-500'>
                                        Tình trạng khi mượn:
                                    </span>
                                    <span className='font-medium'>
                                        {selectedBookForReturn.original_condition ===
                                            'new' && 'Mới'}
                                        {selectedBookForReturn.original_condition ===
                                            'good' && 'Tốt'}
                                        {selectedBookForReturn.original_condition ===
                                            'fair' && 'Trung bình'}
                                        {selectedBookForReturn.original_condition ===
                                            'poor' && 'Kém'}
                                        {!selectedBookForReturn.original_condition &&
                                            'Không có thông tin'}
                                    </span>
                                </div>
                            </div>

                            {/* Late Fee */}
                            {returnFormData.calculated_late_fee > 0 && (
                                <div className='p-4 bg-red-50 rounded-lg'>
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-red-700 font-medium'>
                                            Phí phạt quá hạn (
                                            {returnFormData.days_late} ngày)
                                        </span>
                                        <span className='text-red-700 font-bold'>
                                            {formatCurrency(
                                                returnFormData.calculated_late_fee
                                            )}
                                        </span>
                                    </div>
                                    <p className='text-xs text-red-600'>
                                        * Sách đã quá hạn, phí phạt được tính tự
                                        động
                                    </p>
                                </div>
                            )}

                            {/* Damage/Lost Fine Display */}
                            {returnFormData.condition_on_return !== 'good' &&
                                returnFormData.calculated_damage_fee > 0 && (
                                    <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
                                        <div className='flex justify-between items-center mb-1'>
                                            <span className='text-orange-700'>
                                                {returnFormData.condition_on_return ===
                                                'lost'
                                                    ? 'Phí bồi thường mất sách'
                                                    : 'Phí phạt hư hỏng'}
                                                (
                                                {returnFormData.condition_on_return ===
                                                'fair'
                                                    ? '30%'
                                                    : returnFormData.condition_on_return ===
                                                        'poor'
                                                      ? '70%'
                                                      : '100%'}{' '}
                                                giá sách)
                                            </span>
                                            <span className='text-orange-700 font-bold'>
                                                {formatCurrency(
                                                    returnFormData.calculated_damage_fee
                                                )}
                                            </span>
                                        </div>
                                        <p className='text-xs text-orange-600'>
                                            {returnFormData.condition_on_return ===
                                            'lost'
                                                ? '* Sách bị mất, độc giả phải bồi thường 100% giá sách'
                                                : '* Sách bị hư hỏng, phí phạt được tính theo mức độ'}
                                        </p>
                                    </div>
                                )}

                            {/* Total Fine Display */}
                            {(returnFormData.calculated_late_fee > 0 ||
                                returnFormData.calculated_damage_fee > 0) && (
                                <div className='bg-gray-100 border border-gray-300 rounded-lg p-3'>
                                    <div className='flex justify-between items-center'>
                                        <span className='text-gray-800 font-semibold'>
                                            Tổng phí phạt
                                        </span>
                                        <span className='text-red-600 font-bold text-lg'>
                                            {formatCurrency(
                                                returnFormData.calculated_late_fee +
                                                    returnFormData.calculated_damage_fee
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Condition on Return */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Tình trạng khi trả
                                </label>
                                <select
                                    value={returnFormData.condition_on_return}
                                    onChange={(e) => {
                                        const newCondition = e.target.value;
                                        const { damageFee, lateFee } =
                                            calculateDamageFine(
                                                newCondition,
                                                selectedBookForReturn?.price,
                                                returnFormData.days_late,
                                                returnFormData.calculated_late_fee
                                            );
                                        setReturnFormData({
                                            ...returnFormData,
                                            condition_on_return: newCondition,
                                            calculated_damage_fee: damageFee,
                                            calculated_late_fee: lateFee
                                        });
                                    }}
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                >
                                    <option value='good'>Tốt (như mới)</option>
                                    <option value='fair'>Hư hỏng nhẹ</option>
                                    <option value='poor'>Hư hỏng nặng</option>
                                    <option value='lost'>Mất</option>
                                </select>
                            </div>

                            {/* Damage Description */}
                            {returnFormData.condition_on_return !== 'good' && (
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Mô tả hư hỏng
                                    </label>
                                    <textarea
                                        value={
                                            returnFormData.damage_description
                                        }
                                        onChange={(e) =>
                                            setReturnFormData({
                                                ...returnFormData,
                                                damage_description:
                                                    e.target.value
                                            })
                                        }
                                        placeholder='Mô tả chi tiết tình trạng sách...'
                                        rows={3}
                                        className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    />
                                </div>
                            )}

                            {/* Payment Method */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Phương thức thanh toán phí phạt (nếu có)
                                </label>
                                <select
                                    value={
                                        returnFormData.fine_payment_method_id
                                    }
                                    onChange={(e) =>
                                        setReturnFormData({
                                            ...returnFormData,
                                            fine_payment_method_id: parseInt(
                                                e.target.value
                                            )
                                        })
                                    }
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                >
                                    <option value={1}>Tiền mặt</option>
                                    <option value={2}>Chuyển khoản</option>
                                </select>
                            </div>
                        </div>

                        <div className='p-6 border-t border-gray-100 bg-gray-50'>
                            <div className='flex justify-end gap-3'>
                                <button
                                    onClick={closeReturnModal}
                                    className='px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors'
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleReturnSubmit}
                                    disabled={processingReturn}
                                    className='px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {processingReturn
                                        ? 'Đang xử lý...'
                                        : 'Xác nhận trả sách'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Borrowing;
