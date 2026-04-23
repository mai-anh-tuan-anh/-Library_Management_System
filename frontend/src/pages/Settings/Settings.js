import React from 'react';
import { RiSettingsLine, RiShieldLine, RiNotificationLine, RiDatabaseLine } from 'react-icons/ri';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500 mt-1">Quản lý cài đặt hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <RiSettingsLine className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-semibold">Thông tin thư viện</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên thư viện</label>
              <input type="text" defaultValue="National Library" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <textarea rows={2} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="tel" className="input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <RiShieldLine className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold">Quy tắc mượn sách</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mượn tối đa</label>
              <input type="number" defaultValue={14} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm phạt trễ hạn</label>
              <input type="number" defaultValue={50} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng hạ cấp thành viên</label>
              <input type="number" defaultValue={5} className="input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RiNotificationLine className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold">Thông báo</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600" />
              <span>Gửi nhắc nhở trước 3 ngày</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600" />
              <span>Gửi nhắc nhở trước 1 ngày</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-primary-600" />
              <span>Gửi email xác nhận</span>
            </label>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RiDatabaseLine className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold">Sao lưu dữ liệu</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Lần sao lưu cuối: Chưa có</p>
            <button className="btn-secondary w-full">
              Sao lưu ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
