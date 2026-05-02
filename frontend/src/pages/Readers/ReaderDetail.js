import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    RiArrowLeftLine,
    RiUserLine,
    RiPhoneLine,
    RiMailLine,
    RiMapPinLine,
    RiVipCrownLine,
    RiBookLine,
    RiTimeLine,
    RiAlertLine,
    RiHistoryLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import readerService from '../../services/readerService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
};

const getTierColor = (tierName) => {
    const colors = {
        Đồng: 'bg-amber-100 text-amber-800 border-amber-200',
        Bạc: 'bg-gray-100 text-gray-800 border-gray-200',
        Vàng: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Kim Cương': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        'Huyền Thoại': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[tierName] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining < 0) return 'text-red-600 bg-red-50';
    if (daysRemaining <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
};

const ReaderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reader, setReader] = useState(null);
    const [currentBorrows, setCurrentBorrows] = useState([]);
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        loadReaderData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'history') {
            loadBorrowHistory();
        }
    }, [activeTab, id]);

    const loadReaderData = async () => {
        try {
            const [readerRes, borrowsRes] = await Promise.all([
                readerService.getById(id),
                readerService.getCurrentBorrows(id)
            ]);

            setReader(readerRes.data);
            setCurrentBorrows(borrowsRes.data || []);
        } catch (error) {
            toast.error('Không thể tải thông tin độc giả');
            navigate('/readers');
        } finally {
            setLoading(false);
        }
    };

    const loadBorrowHistory = async () => {
        try {
            const res = await readerService.getBorrowHistory(id);
            setBorrowHistory(res.data || []);
        } catch (error) {
            toast.error('Không thể tải lịch sử mượn');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
        );
    }

    if (!reader) return null;

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <button
                    onClick={() => navigate('/readers')}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                    <RiArrowLeftLine className='w-5 h-5' />
                </button>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        {reader.full_name}
                    </h1>
                    <p className='text-gray-500'>{reader.card_number}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className='border-b border-gray-200'>
                <nav className='flex gap-8'>
                    {[
                        {
                            id: 'info',
                            label: 'Thông tin chung',
                            icon: RiUserLine
                        },
                        {
                            id: 'borrows',
                            label: 'Sách đang mượn',
                            icon: RiBookLine
                        },
                        {
                            id: 'history',
                            label: 'Lịch sử mượn',
                            icon: RiHistoryLine
                        }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className='w-4 h-4' />
                            {tab.label}
                            {tab.id === 'borrows' &&
                                currentBorrows.length > 0 && (
                                    <span className='ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs'>
                                        {currentBorrows.length}
                                    </span>
                                )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'info' && (
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Basic Info */}
                    <div className='lg:col-span-2 space-y-6'>
                        <div className='card p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                                Thông tin cá nhân
                            </h3>
                            <div className='grid grid-cols-2 gap-6'>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Họ và tên
                                    </label>
                                    <p className='font-medium'>
                                        {reader.full_name}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Giới tính
                                    </label>
                                    <p className='font-medium capitalize'>
                                        {reader.gender === 'male'
                                            ? 'Nam'
                                            : reader.gender === 'female'
                                              ? 'Nữ'
                                              : 'Khác'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Ngày sinh
                                    </label>
                                    <p className='font-medium'>
                                        {reader.date_of_birth
                                            ? format(
                                                  new Date(
                                                      reader.date_of_birth
                                                  ),
                                                  'dd/MM/yyyy',
                                                  { locale: vi }
                                              )
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        CMND/CCCD
                                    </label>
                                    <p className='font-medium'>
                                        {reader.id_card || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Điện thoại
                                    </label>
                                    <p className='font-medium flex items-center gap-2'>
                                        <RiPhoneLine className='w-4 h-4 text-gray-400' />
                                        {reader.phone}
                                    </p>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Email
                                    </label>
                                    <p className='font-medium flex items-center gap-2'>
                                        <RiMailLine className='w-4 h-4 text-gray-400' />
                                        {reader.email || '-'}
                                    </p>
                                </div>
                                <div className='col-span-2'>
                                    <label className='text-sm text-gray-500'>
                                        Địa chỉ
                                    </label>
                                    <p className='font-medium flex items-center gap-2'>
                                        <RiMapPinLine className='w-4 h-4 text-gray-400' />
                                        {reader.address || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Borrow Stats */}
                        <div className='card p-6'>
                            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                                Thống kê mượn sách
                            </h3>
                            <div className='grid grid-cols-4 gap-4'>
                                <div className='text-center p-4 bg-primary-50 rounded-lg'>
                                    <p className='text-2xl font-bold text-primary-600'>
                                        {reader.total_borrows || 0}
                                    </p>
                                    <p className='text-sm text-gray-600'>
                                        Tổng lượt mượn
                                    </p>
                                </div>
                                <div className='text-center p-4 bg-green-50 rounded-lg'>
                                    <p className='text-2xl font-bold text-green-600'>
                                        {reader.current_borrows || 0}
                                    </p>
                                    <p className='text-sm text-gray-600'>
                                        Đang mượn
                                    </p>
                                </div>
                                <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                                    <p className='text-2xl font-bold text-yellow-600'>
                                        {reader.late_count || 0}
                                    </p>
                                    <p className='text-sm text-gray-600'>
                                        Trễ hạn
                                    </p>
                                </div>
                                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                                    <p className='text-2xl font-bold text-purple-600'>
                                        {reader.active_transactions || 0}
                                    </p>
                                    <p className='text-sm text-gray-600'>
                                        Phiếu đang mở
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Membership Card */}
                    <div className='space-y-6'>
                        <div
                            className={`card p-6 border-2 ${getTierColor(reader.tier_name)}`}
                        >
                            <div className='text-center'>
                                <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center'>
                                    <RiVipCrownLine className='w-10 h-10' />
                                </div>
                                <h3 className='text-xl font-bold'>
                                    {reader.tier_name}
                                </h3>
                                <p className='text-sm opacity-75 mt-1'>
                                    Cấp độ thành viên
                                </p>
                            </div>

                            <div className='mt-6 space-y-3'>
                                <div className='flex justify-between text-sm'>
                                    <span className='opacity-75'>
                                        Sách tối đa
                                    </span>
                                    <span className='font-semibold'>
                                        {reader.max_books} cuốn
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span className='opacity-75'>
                                        Ngày mượn tối đa
                                    </span>
                                    <span className='font-semibold'>
                                        {reader.max_borrow_days} ngày
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className='card p-6'>
                            <h4 className='font-medium text-gray-900 mb-3'>
                                Trạng thái
                            </h4>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-500'>
                                        Tài khoản
                                    </span>
                                    <span
                                        className={`badge ${reader.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    >
                                        {reader.is_active
                                            ? 'Hoạt động'
                                            : 'Không hoạt động'}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-500'>
                                        Danh sách đen
                                    </span>
                                    <span
                                        className={`badge ${reader.is_blacklisted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                                    >
                                        {reader.is_blacklisted ? 'Có' : 'Không'}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-500'>
                                        Ngày đăng ký
                                    </span>
                                    <span className='text-sm font-medium'>
                                        {format(
                                            new Date(reader.registered_at),
                                            'dd/MM/yyyy',
                                            { locale: vi }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'borrows' && (
                <div className='card overflow-hidden'>
                    {currentBorrows.length === 0 ? (
                        <div className='p-12 text-center'>
                            <RiBookLine className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                            <p className='text-gray-500'>
                                Độc giả này hiện không mượn sách nào
                            </p>
                        </div>
                    ) : (
                        <div className='max-h-96 overflow-y-auto overflow-x-auto'>
                            <table className='w-full'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='table-header'>Sách</th>
                                        <th className='table-header'>
                                            Barcode
                                        </th>
                                        <th className='table-header'>
                                            Ngày mượn
                                        </th>
                                        <th className='table-header'>
                                            Hạn trả
                                        </th>
                                        <th className='table-header'>
                                            Còn lại
                                        </th>
                                        <th className='table-header'>Phí</th>
                                        <th className='table-header'>
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200'>
                                    {currentBorrows.map((borrow) => (
                                        <tr
                                            key={borrow.detail_id}
                                            className='hover:bg-gray-50'
                                        >
                                            <td className='table-cell'>
                                                <div className='flex items-center gap-3'>
                                                    {borrow.cover_image ? (
                                                        <img
                                                            src={
                                                                borrow.cover_image
                                                            }
                                                            alt={borrow.title}
                                                            className='w-10 h-14 object-cover rounded'
                                                        />
                                                    ) : (
                                                        <div className='w-10 h-14 bg-gray-200 rounded flex items-center justify-center'>
                                                            <RiBookLine className='w-5 h-5 text-gray-400' />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className='font-medium text-gray-900'>
                                                            {borrow.title}
                                                        </p>
                                                        <p className='text-sm text-gray-500'>
                                                            Mã:{' '}
                                                            {
                                                                borrow.transaction_code
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='table-cell font-mono'>
                                                {borrow.barcode}
                                            </td>
                                            <td className='table-cell'>
                                                {format(
                                                    new Date(
                                                        borrow.borrow_date
                                                    ),
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )}
                                            </td>
                                            <td className='table-cell'>
                                                {format(
                                                    new Date(
                                                        borrow.expected_return_date
                                                    ),
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )}
                                            </td>
                                            <td className='table-cell'>
                                                <span
                                                    className={`badge ${getUrgencyColor(borrow.days_remaining)}`}
                                                >
                                                    {borrow.days_remaining > 0
                                                        ? `${borrow.days_remaining} ngày`
                                                        : `${Math.abs(borrow.days_remaining)} ngày quá hạn`}
                                                </span>
                                            </td>
                                            <td className='table-cell font-medium'>
                                                {formatCurrency(
                                                    borrow.subtotal
                                                )}
                                            </td>
                                            <td className='table-cell'>
                                                <span
                                                    className={`badge ${
                                                        borrow.urgency_status ===
                                                        'overdue'
                                                            ? 'bg-red-100 text-red-800'
                                                            : borrow.urgency_status ===
                                                                'due_soon'
                                                              ? 'bg-yellow-100 text-yellow-800'
                                                              : 'bg-green-100 text-green-800'
                                                    }`}
                                                >
                                                    {borrow.urgency_status ===
                                                    'overdue'
                                                        ? 'Quá hạn'
                                                        : borrow.urgency_status ===
                                                            'due_soon'
                                                          ? 'Sắp đến hạn'
                                                          : 'Bình thường'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className='space-y-4'>
                    {borrowHistory.length === 0 ? (
                        <div className='card p-12 text-center'>
                            <RiHistoryLine className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                            <p className='text-gray-500'>
                                Chưa có lịch sử mượn nào
                            </p>
                        </div>
                    ) : (
                        borrowHistory.map((transaction) => (
                            <div
                                key={transaction.transaction_id}
                                className='card overflow-hidden'
                            >
                                <div className='p-4 border-b border-gray-100 bg-gray-50'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <span className='text-sm font-medium text-gray-900'>
                                                {transaction.transaction_code}
                                            </span>
                                            <span className='ml-2 text-xs text-gray-500'>
                                                {new Date(
                                                    transaction.borrow_date
                                                ).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <span
                                            className={`badge ${
                                                transaction.status ===
                                                'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : transaction.status ===
                                                        'active'
                                                      ? 'bg-blue-100 text-blue-800'
                                                      : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {transaction.status === 'completed'
                                                ? 'Đã hoàn thành'
                                                : transaction.status ===
                                                    'active'
                                                  ? 'Đang mượn'
                                                  : transaction.status}
                                        </span>
                                    </div>
                                </div>
                                <div className='p-4'>
                                    <table className='w-full'>
                                        <thead>
                                            <tr className='text-left text-xs text-gray-500 border-b'>
                                                <th className='pb-2'>Sách</th>
                                                <th className='pb-2'>
                                                    Barcode
                                                </th>
                                                <th className='pb-2'>
                                                    Phí mượn
                                                </th>
                                                <th className='pb-2'>
                                                    Phí phạt
                                                </th>
                                                <th className='pb-2'>
                                                    Trạng thái
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.books?.map((book) => (
                                                <tr
                                                    key={book.detail_id}
                                                    className='text-sm'
                                                >
                                                    <td className='py-2'>
                                                        {book.book_title}
                                                    </td>
                                                    <td className='py-2 text-gray-500'>
                                                        {book.barcode}
                                                    </td>
                                                    <td className='py-2'>
                                                        {formatCurrency(
                                                            book.subtotal
                                                        )}
                                                    </td>
                                                    <td className='py-2 text-red-600'>
                                                        {book.total_fine > 0
                                                            ? formatCurrency(
                                                                  book.total_fine
                                                              )
                                                            : '-'}
                                                    </td>
                                                    <td className='py-2'>
                                                        {book.actual_return_date ? (
                                                            <span className='text-green-600'>
                                                                Đã trả
                                                            </span>
                                                        ) : (
                                                            <span className='text-blue-600'>
                                                                Đang mượn
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className='mt-3 pt-3 border-t border-gray-100 flex justify-between items-center'>
                                        <span className='text-sm text-gray-500'>
                                            {transaction.total_books} cuốn · Hạn
                                            trả:{' '}
                                            {new Date(
                                                transaction.due_date
                                            ).toLocaleDateString('vi-VN')}
                                        </span>
                                        <span className='font-semibold'>
                                            Tổng:{' '}
                                            {formatCurrency(
                                                transaction.total_fee
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ReaderDetail;
