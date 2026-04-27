import React, { useState, useEffect } from 'react';
import {
    RiSettingsLine,
    RiShieldLine,
    RiNotificationLine,
    RiSaveLine,
    RiLoader4Line
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import settingsService from '../../services/settingsService';

const Settings = () => {
    const [settings, setSettings] = useState({
        library_name: 'National Library',
        max_borrow_days: 14,
        late_penalty_percent: 50,
        demotion_threshold: 5,
        enable_3day_reminder: true,
        enable_1day_reminder: true,
        enable_email_confirmation: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsService.getSettings();
            if (response.data?.success && response.data?.data) {
                setSettings((prev) => ({
                    ...prev,
                    ...response.data.data
                }));
            }
        } catch (error) {
            toast.error('Không thể tải cài đặt');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsService.updateSettings({
                library_name: settings.library_name,
                max_borrow_days: settings.max_borrow_days,
                late_penalty_percent: settings.late_penalty_percent,
                demotion_threshold: settings.demotion_threshold,
                enable_3day_reminder: settings.enable_3day_reminder,
                enable_1day_reminder: settings.enable_1day_reminder,
                enable_email_confirmation: settings.enable_email_confirmation
            });
            toast.success('Lưu cài đặt thành công!');
        } catch (error) {
            toast.error('Không thể lưu cài đặt');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <RiLoader4Line className='animate-spin text-3xl text-blue-500' />
            </div>
        );
    }

    return (
        <div className='p-6'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Cài đặt</h1>
                <p className='text-gray-500'>Quản lý cài đặt hệ thống</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Library Info */}
                <div className='bg-white rounded-lg shadow p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                            <RiSettingsLine className='text-blue-600 text-xl' />
                        </div>
                        <h2 className='text-lg font-semibold'>
                            Thông tin thư viện
                        </h2>
                    </div>
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Tên thư viện
                            </label>
                            <input
                                type='text'
                                value={settings.library_name}
                                onChange={(e) =>
                                    handleChange('library_name', e.target.value)
                                }
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Địa chỉ
                            </label>
                            <textarea
                                value={settings.address || ''}
                                onChange={(e) =>
                                    handleChange('address', e.target.value)
                                }
                                rows='2'
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Số điện thoại
                            </label>
                            <input
                                type='text'
                                value={settings.phone || ''}
                                onChange={(e) =>
                                    handleChange('phone', e.target.value)
                                }
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                    </div>
                </div>

                {/* Borrow Rules */}
                <div className='bg-white rounded-lg shadow p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <RiShieldLine className='text-green-600 text-xl' />
                        </div>
                        <h2 className='text-lg font-semibold'>
                            Quy tắc mượn sách
                        </h2>
                    </div>
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Ngày mượn tối đa
                            </label>
                            <input
                                type='number'
                                min='1'
                                value={settings.max_borrow_days}
                                onChange={(e) =>
                                    handleChange(
                                        'max_borrow_days',
                                        parseInt(e.target.value) || 14
                                    )
                                }
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Phần trăm phạt trễ hạn (% giá sách trên ngày)
                            </label>
                            <input
                                type='number'
                                min='0'
                                max='100'
                                value={settings.late_penalty_percent}
                                onChange={(e) =>
                                    handleChange(
                                        'late_penalty_percent',
                                        parseInt(e.target.value) || 50
                                    )
                                }
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Ngưỡng hạ cấp thành viên
                            </label>
                            <input
                                type='number'
                                min='1'
                                value={settings.demotion_threshold}
                                onChange={(e) =>
                                    handleChange(
                                        'demotion_threshold',
                                        parseInt(e.target.value) || 5
                                    )
                                }
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className='bg-white rounded-lg shadow p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-yellow-100 rounded-lg'>
                            <RiNotificationLine className='text-yellow-600 text-xl' />
                        </div>
                        <h2 className='text-lg font-semibold'>Thông báo</h2>
                    </div>
                    <div className='space-y-3'>
                        <label className='flex items-center gap-3 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={settings.enable_3day_reminder}
                                onChange={(e) =>
                                    handleChange(
                                        'enable_3day_reminder',
                                        e.target.checked
                                    )
                                }
                                className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                            />
                            <span className='text-sm'>
                                Gửi nhắc nhở trước 3 ngày
                            </span>
                        </label>
                        <label className='flex items-center gap-3 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={settings.enable_1day_reminder}
                                onChange={(e) =>
                                    handleChange(
                                        'enable_1day_reminder',
                                        e.target.checked
                                    )
                                }
                                className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                            />
                            <span className='text-sm'>
                                Gửi nhắc nhở trước 1 ngày
                            </span>
                        </label>
                        <label className='flex items-center gap-3 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={settings.enable_email_confirmation}
                                onChange={(e) =>
                                    handleChange(
                                        'enable_email_confirmation',
                                        e.target.checked
                                    )
                                }
                                className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                            />
                            <span className='text-sm'>Gửi email xác nhận</span>
                        </label>
                    </div>
                </div>

                {/* Data Backup - Placeholder */}
                <div className='bg-white rounded-lg shadow p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-purple-100 rounded-lg'>
                            <RiSaveLine className='text-purple-600 text-xl' />
                        </div>
                        <h2 className='text-lg font-semibold'>
                            Sao lưu dữ liệu
                        </h2>
                    </div>
                    <p className='text-sm text-gray-500 mb-4'>
                        Lần sao lưu cuối: Chưa có
                    </p>
                    <button className='w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'>
                        Sao lưu ngay
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className='fixed bottom-6 right-6'>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
                >
                    {saving ? (
                        <>
                            <RiLoader4Line className='animate-spin' />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <RiSaveLine />
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Settings;
