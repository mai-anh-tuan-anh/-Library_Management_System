import React from 'react';
import { RiMenuLine, RiNotificationLine, RiSearchLine } from 'react-icons/ri';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    return (
        <header className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6'>
            {/* Left: Menu Toggle & Search */}
            <div className='flex items-center gap-4'>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className='p-2 rounded-lg hover:bg-gray-100 hidden lg:flex'
                >
                    <RiMenuLine className='w-5 h-5 text-gray-600' />
                </button>
            </div>

            {/* Right: Notifications */}
            <div className='flex items-center gap-3'>
                <button className='relative p-2 rounded-lg hover:bg-gray-100'>
                    <RiNotificationLine className='w-5 h-5 text-gray-600' />
                    <span className='absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full'></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
