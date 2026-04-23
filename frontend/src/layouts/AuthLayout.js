import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">National Library</h1>
          <p className="text-primary-100">Hệ thống Quản lý Thư viện</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
