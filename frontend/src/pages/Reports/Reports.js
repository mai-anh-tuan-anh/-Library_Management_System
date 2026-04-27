import React, { useState, useEffect } from 'react';
import {
    RiBarChartLine,
    RiDownloadLine,
    RiCalendarLine,
    RiBookLine,
    RiUserLine
} from 'react-icons/ri';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [revenueData, setRevenueData] = useState({
        labels: [],
        datasets: []
    });
    const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
    const [topBooks, setTopBooks] = useState([]);
    const [topReaders, setTopReaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, [activeTab]);

    const loadReports = async () => {
        setLoading(true);
        try {
            if (activeTab === 'revenue') {
                const [dailyRes, weeklyRes] = await Promise.all([
                    reportService.getRevenueDaily(),
                    reportService.getRevenueWeekly()
                ]);

                // Use daily data for the weekly chart (7 days)
                if (dailyRes.data) {
                    const labels = dailyRes.data
                        .slice(0, 7)
                        .map((r) => {
                            const date = new Date(r.revenue_date);
                            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                        })
                        .reverse();
                    const borrowData = dailyRes.data
                        .slice(0, 7)
                        .map((r) => parseFloat(r.borrow_revenue) || 0)
                        .reverse();
                    const fineData = dailyRes.data
                        .slice(0, 7)
                        .map((r) => parseFloat(r.fine_revenue) || 0)
                        .reverse();

                    setRevenueData({
                        labels,
                        datasets: [
                            {
                                label: 'Phí mượn',
                                data: borrowData,
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: 'rgb(59, 130, 246)',
                                borderWidth: 1
                            },
                            {
                                label: 'Phí phạt',
                                data: fineData,
                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                borderColor: 'rgb(239, 68, 68)',
                                borderWidth: 1
                            }
                        ]
                    });
                }

                // Store weekly data for weekly breakdown chart (4 weeks)
                if (weeklyRes.data) {
                    setMonthlyRevenueData(weeklyRes.data);
                }
            } else if (activeTab === 'top-books') {
                const response = await reportService.getTopBooks(10);
                setTopBooks(response.data || []);
            } else if (activeTab === 'top-readers') {
                const response = await reportService.getTopReaders(10);
                setTopReaders(response.data || []);
            }
        } catch (error) {
            toast.error('Không thể tải báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        Báo cáo & Thống kê
                    </h1>
                    <p className='text-gray-500 mt-1'>
                        Xem báo cáo doanh thu, sách mượn nhiều, độc giả tích cực
                    </p>
                </div>
                <button className='btn-secondary gap-2'>
                    <RiDownloadLine className='w-5 h-5' />
                    Xuất Excel
                </button>
            </div>

            {/* Tabs */}
            <div className='border-b border-gray-200'>
                <nav className='flex gap-8'>
                    {[
                        {
                            id: 'revenue',
                            label: 'Doanh thu',
                            icon: RiBarChartLine
                        },
                        {
                            id: 'top-books',
                            label: 'Top sách',
                            icon: RiBookLine
                        },
                        {
                            id: 'top-readers',
                            label: 'Top độc giả',
                            icon: RiUserLine
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
                        </button>
                    ))}
                </nav>
            </div>

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
                <div className='space-y-6'>
                    {/* Weekly Bar Chart */}
                    <div className='card p-6'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Doanh thu trong tuần
                        </h3>
                        <div className='h-80'>
                            <Line
                                data={revenueData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    elements: {
                                        line: {
                                            tension: 0.4
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value) =>
                                                    formatCurrency(value)
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Monthly Line Chart */}
                    <div className='card p-6'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Doanh thu trong tháng
                        </h3>
                        <div className='h-80'>
                            <Bar
                                data={{
                                    labels: monthlyRevenueData
                                        .slice(0, 4)
                                        .map(
                                            (r) =>
                                                r.week_formatted || r.week_label
                                        )
                                        .reverse(),
                                    datasets: [
                                        {
                                            label: 'Phí mượn',
                                            data: monthlyRevenueData
                                                .slice(0, 4)
                                                .map(
                                                    (r) =>
                                                        parseFloat(
                                                            r.borrow_revenue
                                                        ) || 0
                                                )
                                                .reverse(),
                                            backgroundColor:
                                                'rgba(59, 130, 246, 0.8)',
                                            borderColor: 'rgb(59, 130, 246)',
                                            borderWidth: 1
                                        },
                                        {
                                            label: 'Phí phạt',
                                            data: monthlyRevenueData
                                                .slice(0, 4)
                                                .map(
                                                    (r) =>
                                                        parseFloat(
                                                            r.fine_revenue
                                                        ) || 0
                                                )
                                                .reverse(),
                                            backgroundColor:
                                                'rgba(239, 68, 68, 0.8)',
                                            borderColor: 'rgb(239, 68, 68)',
                                            borderWidth: 1
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value) =>
                                                    formatCurrency(value)
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Top Books Tab */}
            {activeTab === 'top-books' && (
                <div className='card overflow-hidden'>
                    <div className='p-4 bg-primary-50 border-b'>
                        <h3 className='font-semibold text-primary-800'>
                            Top 10 sách được mượn nhiều nhất
                        </h3>
                    </div>
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='table-header'>Xếp hạng</th>
                                <th className='table-header'>Sách</th>
                                <th className='table-header'>Danh mục</th>
                                <th className='table-header'>Lượt mượn</th>
                                <th className='table-header'>Độc giả</th>
                                <th className='table-header'>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {topBooks.map((book, index) => (
                                <tr
                                    key={book.book_id}
                                    className='hover:bg-gray-50'
                                >
                                    <td className='table-cell'>
                                        <span
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                index === 0
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : index === 1
                                                      ? 'bg-gray-100 text-gray-800'
                                                      : index === 2
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-3'>
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image}
                                                    alt={book.title}
                                                    className='w-10 h-14 object-cover rounded'
                                                />
                                            ) : (
                                                <div className='w-10 h-14 bg-gray-200 rounded flex items-center justify-center'>
                                                    <RiBookLine className='w-5 h-5 text-gray-400' />
                                                </div>
                                            )}
                                            <div>
                                                <p className='font-medium'>
                                                    {book.title}
                                                </p>
                                                <p className='text-sm text-gray-500'>
                                                    {book.book_code}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        {book.category_name || '-'}
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-blue-100 text-blue-800'>
                                            {book.total_borrows} lượt
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        {book.unique_readers} người
                                    </td>
                                    <td className='table-cell font-medium'>
                                        {formatCurrency(book.total_revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Top Readers Tab */}
            {activeTab === 'top-readers' && (
                <div className='card overflow-hidden'>
                    <div className='p-4 bg-green-50 border-b'>
                        <h3 className='font-semibold text-green-800'>
                            Top 10 độc giả tích cực
                        </h3>
                    </div>
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='table-header'>Xếp hạng</th>
                                <th className='table-header'>Độc giả</th>
                                <th className='table-header'>Cấp độ</th>
                                <th className='table-header'>Lượt mượn</th>
                                <th className='table-header'>Sách đã đọc</th>
                                <th className='table-header'>Tổng phí</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {topReaders.map((reader, index) => (
                                <tr
                                    key={reader.reader_id}
                                    className='hover:bg-gray-50'
                                >
                                    <td className='table-cell'>
                                        <span
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                index === 0
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : index === 1
                                                      ? 'bg-gray-100 text-gray-800'
                                                      : index === 2
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <div>
                                            <p className='font-medium'>
                                                {reader.full_name}
                                            </p>
                                            <p className='text-sm text-gray-500'>
                                                {reader.card_number}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-primary-100 text-primary-800'>
                                            {reader.tier_name}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-blue-100 text-blue-800'>
                                            {reader.total_borrows} lượt
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        {reader.books_read} cuốn
                                    </td>
                                    <td className='table-cell font-medium'>
                                        {formatCurrency(reader.total_spent)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;
