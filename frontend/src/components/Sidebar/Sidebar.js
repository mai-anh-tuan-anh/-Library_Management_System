import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    RiDashboardLine,
    RiUserLine,
    RiBookLine,
    RiExchangeLine,
    RiAlarmWarningLine,
    RiBarChartLine,
    RiSettingsLine,
    RiMenuFoldLine,
    RiMenuUnfoldLine,
    RiLogoutBoxLine
} from 'react-icons/ri';
import { useAuthStore } from '../../stores/authStore';

const allMenuItems = [
    {
        path: '/dashboard',
        label: 'Tổng quan',
        icon: RiDashboardLine,
        roles: ['admin', 'librarian', 'staff', 'accountant']
    },
    {
        path: '/readers',
        label: 'Quản lý Độc giả',
        icon: RiUserLine,
        roles: ['admin', 'librarian', 'staff']
    },
    {
        path: '/books',
        label: 'Quản lý Sách',
        icon: RiBookLine,
        roles: ['admin', 'librarian', 'staff', 'reader']
    },
    {
        path: '/borrowing',
        label: 'Mượn sách / Trả sách',
        icon: RiExchangeLine,
        roles: ['admin', 'librarian', 'staff']
    },
    {
        path: '/due-alerts',
        label: 'Cảnh báo hạn trả',
        icon: RiAlarmWarningLine,
        roles: ['admin', 'librarian', 'staff']
    },
    {
        path: '/reports',
        label: 'Báo cáo',
        icon: RiBarChartLine,
        roles: ['admin', 'accountant']
    },
    {
        path: '/settings',
        label: 'Cài đặt',
        icon: RiSettingsLine,
        roles: ['admin']
    }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    // Get user's role from user object
    const userRole = user?.role || 'reader';

    // Filter menu items based on role
    const menuItems = allMenuItems.filter((item) =>
        item.roles.includes(userRole)
    );

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {!isOpen && (
                <div
                    className='fixed inset-0 bg-black/50 z-20 lg:hidden'
                    onClick={() => setIsOpen(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
                    isOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0 lg:w-20'
                }`}
            >
                {/* Logo */}
                <div className='h-16 flex items-center justify-between px-4 border-b border-gray-200'>
                    <div
                        className={`flex items-center gap-2 ${!isOpen && 'lg:hidden'}`}
                    >
                        <div className='w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center'>
                            <RiBookLine className='w-5 h-5 text-white' />
                        </div>
                        <span className='font-bold text-gray-900'>Library</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className='p-2 rounded-lg hover:bg-gray-100 lg:hidden'
                    >
                        {isOpen ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className='p-4 space-y-1'>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(
                            item.path
                        );

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    } ${!isOpen && 'lg:justify-center lg:px-2'}`
                                }
                            >
                                <Icon
                                    className={`w-5 h-5 ${isActive && 'text-primary-600'}`}
                                />
                                <span className={`${!isOpen && 'lg:hidden'}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200'>
                    <div
                        className={`flex items-center gap-3 mb-3 ${!isOpen && 'lg:hidden'}`}
                    >
                        <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-gray-600'>
                                {user?.full_name?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 truncate'>
                                {user?.full_name || 'Admin'}
                            </p>
                            <p className='text-xs text-gray-500 truncate'>
                                {user?.email || 'admin@library.vn'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                            !isOpen && 'lg:justify-center lg:px-2'
                        }`}
                    >
                        <RiLogoutBoxLine className='w-5 h-5' />
                        <span className={`${!isOpen && 'lg:hidden'}`}>
                            Đăng xuất
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
