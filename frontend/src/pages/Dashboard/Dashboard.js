import React, { useEffect, useState } from 'react';
import {
    RiUserLine,
    RiBookLine,
    RiExchangeLine,
    RiMoneyDollarCircleLine,
    RiArrowUpLine,
    RiArrowDownLine,
    RiAlarmWarningLine,
    RiTimeLine
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
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import reportService from '../../services/reportService';
import borrowService from '../../services/borrowService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className='card p-6'>
        <div className='flex items-start justify-between'>
            <div>
                <p className='text-sm font-medium text-gray-500'>{title}</p>
                <p className='text-2xl font-bold text-gray-900 mt-2'>{value}</p>
                {trend && (
                    <div
                        className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                    >
                        {trend === 'up' ? (
                            <RiArrowUpLine />
                        ) : (
                            <RiArrowDownLine />
                        )}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className='w-6 h-6 text-white' />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [dueAlerts, setDueAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState({
        labels: [],
        datasets: []
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, alertsRes, revenueRes] = await Promise.all([
                reportService.getDashboardStats(),
                borrowService.getDueAlerts(),
                reportService.getRevenueMonthly()
            ]);

            setStats(statsRes.data);
            // Filter: only show books NOT yet overdue (days_remaining >= 0)
            const dueAlertsData = (alertsRes.data || [])
                .filter((item) => item.days_remaining >= 0)
                .slice(0, 5);
            setDueAlerts(dueAlertsData);

            // Prepare revenue chart data
            if (revenueRes.data) {
                const labels = revenueRes.data
                    .slice(0, 6)
                    .map((r) => r.month_name)
                    .reverse();
                const borrowData = revenueRes.data
                    .slice(0, 6)
                    .map((r) => r.borrow_revenue)
                    .reverse();
                const fineData = revenueRes.data
                    .slice(0, 6)
                    .map((r) => r.fine_revenue)
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
        } catch (error) {
            console.error('Error loading dashboard:', error);
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

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Page Title */}
            <div>
                <h1 className='text-2xl font-bold text-gray-900'>Tổng quan</h1>
                <p className='text-gray-500 mt-1'>
                    Thông tin tổng quan về hệ thống thư viện
                </p>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <StatCard
                    title='Tổng độc giả'
                    value={stats?.total_active_readers || 0}
                    icon={RiUserLine}
                    trend='up'
                    trendValue={`+${stats?.new_readers_today || 0} độc giả hôm nay`}
                    color='bg-blue-500'
                />
                <StatCard
                    title='Sách trong kho'
                    value={stats?.total_available_copies || 0}
                    icon={RiBookLine}
                    trend='up'
                    trendValue={`+${stats?.new_books_today || 0} đầu sách hôm nay`}
                    color='bg-green-500'
                />
                <StatCard
                    title='Phiếu mượn hôm nay'
                    value={stats?.borrows_today || 0}
                    icon={RiExchangeLine}
                    trend='up'
                    trendValue={`+${stats?.returns_today || 0} lượt trả hôm nay`}
                    color='bg-purple-500'
                />
                <StatCard
                    title='Doanh thu hôm nay'
                    value={formatCurrency(stats?.revenue_today || 0)}
                    icon={RiMoneyDollarCircleLine}
                    trend=''
                    trendValue=''
                    color='bg-yellow-500'
                />
            </div>

            {/* Charts & Alerts */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Revenue Chart */}
                <div className='card p-6 lg:col-span-2'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Doanh thu 6 tháng gần đây
                    </h3>
                    <div className='h-72'>
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

                {/* Due Alerts */}
                <div className='card p-6'>
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                            Cảnh báo sắp đến hạn
                        </h3>
                        <span className='badge bg-yellow-100 text-yellow-800'>
                            {dueAlerts.length}
                        </span>
                    </div>

                    <div className='space-y-3'>
                        {dueAlerts.length === 0 ? (
                            <p className='text-gray-500 text-center py-8'>
                                Không có cảnh báo nào
                            </p>
                        ) : (
                            dueAlerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className='flex items-center gap-3 p-3 bg-yellow-50 rounded-lg'
                                >
                                    <div className='p-2 bg-yellow-100 rounded-lg'>
                                        <RiAlarmWarningLine className='w-5 h-5 text-yellow-600' />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium text-gray-900 truncate'>
                                            {alert.reader_name}
                                        </p>
                                        <p className='text-xs text-gray-500 truncate'>
                                            {alert.book_title}
                                        </p>
                                        <p className='text-xs text-yellow-600 mt-1'>
                                            Còn {alert.days_remaining} ngày
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <a
                    href='/borrowing/new'
                    className='card p-6 hover:shadow-md transition-shadow'
                >
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-primary-100 rounded-lg'>
                            <RiExchangeLine className='w-6 h-6 text-primary-600' />
                        </div>
                        <div>
                            <h3 className='font-medium text-gray-900'>
                                Mượn sách mới
                            </h3>
                            <p className='text-sm text-gray-500'>
                                Tạo phiếu mượn mới
                            </p>
                        </div>
                    </div>
                </a>

                <a
                    href='/returns'
                    className='card p-6 hover:shadow-md transition-shadow'
                >
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-green-100 rounded-lg'>
                            <RiArrowDownLine className='w-6 h-6 text-green-600' />
                        </div>
                        <div>
                            <h3 className='font-medium text-gray-900'>
                                Trả sách
                            </h3>
                            <p className='text-sm text-gray-500'>
                                Xử lý trả sách
                            </p>
                        </div>
                    </div>
                </a>

                <a
                    href='/readers'
                    className='card p-6 hover:shadow-md transition-shadow'
                >
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-purple-100 rounded-lg'>
                            <RiUserLine className='w-6 h-6 text-purple-600' />
                        </div>
                        <div>
                            <h3 className='font-medium text-gray-900'>
                                Thêm độc giả
                            </h3>
                            <p className='text-sm text-gray-500'>
                                Đăng ký độc giả mới
                            </p>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Dashboard;
