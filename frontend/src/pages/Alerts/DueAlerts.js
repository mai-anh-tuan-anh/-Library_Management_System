import React, { useState, useEffect } from 'react';
import {
    RiAlarmWarningLine,
    RiPhoneLine,
    RiMailLine,
    RiCheckLine,
    RiNotificationLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import borrowService from '../../services/borrowService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const DueAlerts = () => {
    const [dueSoon, setDueSoon] = useState([]);
    const [overdue, setOverdue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const [dueRes, overdueRes] = await Promise.all([
                borrowService.getDueAlerts(),
                borrowService.getOverdue()
            ]);
            // Filter: only show books NOT yet overdue in dueSoon (days_remaining >= 0)
            const dueSoonData = (dueRes.data || []).filter(
                (item) => item.days_remaining >= 0
            );
            setDueSoon(dueSoonData);
            setOverdue(overdueRes.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách cảnh báo');
        } finally {
            setLoading(false);
        }
    };

    const sendReminder = async (transactionId, daysRemaining) => {
        try {
            await borrowService.sendReminder(transactionId, daysRemaining);
            toast.success('Đã gửi nhắc nhở');
        } catch (error) {
            toast.error('Gửi nhắc nhở thất bại');
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

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                    Cảnh báo hạn trả
                </h1>
                <p className='text-gray-500 mt-1'>
                    Theo dõi và gửi nhắc nhở cho độc giả
                </p>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-yellow-100 rounded-lg'>
                            <RiAlarmWarningLine className='w-5 h-5 text-yellow-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {dueSoon.length}
                            </p>
                            <p className='text-sm text-gray-500'>
                                Sắp đến hạn (≤3 ngày)
                            </p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-red-100 rounded-lg'>
                            <RiAlarmWarningLine className='w-5 h-5 text-red-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {overdue.length}
                            </p>
                            <p className='text-sm text-gray-500'>Đã quá hạn</p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <RiCheckLine className='w-5 h-5 text-green-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {formatCurrency(
                                    overdue.reduce(
                                        (acc, item) =>
                                            acc + (item.estimated_fine || 0),
                                        0
                                    )
                                )}
                            </p>
                            <p className='text-sm text-gray-500'>
                                Phạt ước tính
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Due Soon List */}
            <div className='card overflow-hidden'>
                <div className='p-4 bg-yellow-50 border-b border-yellow-200'>
                    <h3 className='font-semibold text-yellow-800 flex items-center gap-2'>
                        <RiAlarmWarningLine />
                        Sách sắp đến hạn (cần gọi điện nhắc nhở)
                    </h3>
                </div>

                {dueSoon.length === 0 ? (
                    <div className='p-8 text-center text-gray-500'>
                        Không có sách nào sắp đến hạn
                    </div>
                ) : (
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='table-header'>Độc giả</th>
                                <th className='table-header'>Sách</th>
                                <th className='table-header'>Hạn trả</th>
                                <th className='table-header'>Còn lại</th>
                                <th className='table-header'>Liên hệ</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {dueSoon.map((alert, index) => (
                                <tr key={index} className='hover:bg-gray-50'>
                                    <td className='table-cell'>
                                        <div>
                                            <p className='font-medium'>
                                                {alert.reader_name}
                                            </p>
                                            <p className='text-sm text-gray-500'>
                                                {alert.card_number}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <p className='font-medium'>
                                            {alert.book_title}
                                        </p>
                                        <p className='text-sm text-gray-500 font-mono'>
                                            {alert.barcode}
                                        </p>
                                    </td>
                                    <td className='table-cell'>
                                        {format(
                                            new Date(
                                                alert.expected_return_date
                                            ),
                                            'dd/MM/yyyy',
                                            { locale: vi }
                                        )}
                                    </td>
                                    <td className='table-cell'>
                                        <span
                                            className={`badge ${
                                                alert.days_remaining <= 1
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {alert.days_remaining} ngày
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <RiPhoneLine className='w-4 h-4 text-gray-400' />
                                            <span className='text-sm'>
                                                {alert.reader_phone}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Overdue List */}
            <div className='card overflow-hidden'>
                <div className='p-4 bg-red-50 border-b border-red-200'>
                    <h3 className='font-semibold text-red-800 flex items-center gap-2'>
                        <RiAlarmWarningLine />
                        Sách đã quá hạn (cần thu hồi gấp)
                    </h3>
                </div>

                {overdue.length === 0 ? (
                    <div className='p-8 text-center text-gray-500'>
                        Không có sách nào quá hạn
                    </div>
                ) : (
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='table-header'>Độc giả</th>
                                <th className='table-header'>Sách</th>
                                <th className='table-header'>Hạn trả</th>
                                <th className='table-header'>Quá hạn</th>
                                <th className='table-header'>Phạt ước tính</th>
                                <th className='table-header'>Liên hệ</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {overdue.map((alert, index) => (
                                <tr key={index} className='hover:bg-gray-50'>
                                    <td className='table-cell'>
                                        <div>
                                            <p className='font-medium'>
                                                {alert.reader_name}
                                            </p>
                                            <p className='text-sm text-gray-500'>
                                                {alert.card_number}
                                            </p>
                                            <span className='badge bg-amber-100 text-amber-800 mt-1'>
                                                {alert.tier_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <p className='font-medium'>
                                            {alert.book_title}
                                        </p>
                                        <p className='text-sm text-gray-500 font-mono'>
                                            {alert.barcode}
                                        </p>
                                    </td>
                                    <td className='table-cell'>
                                        {format(
                                            new Date(
                                                alert.expected_return_date
                                            ),
                                            'dd/MM/yyyy',
                                            { locale: vi }
                                        )}
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-red-100 text-red-800'>
                                            {alert.days_overdue} ngày
                                        </span>
                                    </td>
                                    <td className='table-cell font-medium text-red-600'>
                                        {formatCurrency(alert.estimated_fine)}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='space-y-1'>
                                            <div className='flex items-center gap-2'>
                                                <RiPhoneLine className='w-4 h-4 text-gray-400' />
                                                <span className='text-sm'>
                                                    {alert.reader_phone}
                                                </span>
                                            </div>
                                            {alert.reader_email && (
                                                <div className='flex items-center gap-2'>
                                                    <RiMailLine className='w-4 h-4 text-gray-400' />
                                                    <span className='text-sm'>
                                                        {alert.reader_email}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DueAlerts;
