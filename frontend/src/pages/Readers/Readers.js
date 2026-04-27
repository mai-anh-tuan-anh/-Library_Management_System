import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RiSearchLine,
    RiAddLine,
    RiEditLine,
    RiDeleteBinLine,
    RiEyeLine,
    RiUserLine,
    RiPhoneLine,
    RiMailLine,
    RiVipCrownLine,
    RiCloseLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import readerService from '../../services/readerService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const getTierColor = (tierName) => {
    const colors = {
        Đồng: 'bg-bronze',
        Bạc: 'bg-silver',
        Vàng: 'bg-gold',
        'Kim Cương': 'bg-diamond',
        'Huyền Thoại': 'bg-legend'
    };
    return colors[tierName] || 'bg-gray-400';
};

const getTierBg = (tierName) => {
    const colors = {
        Đồng: 'bg-amber-100 text-amber-800',
        Bạc: 'bg-gray-100 text-gray-800',
        Vàng: 'bg-yellow-100 text-yellow-800',
        'Kim Cương': 'bg-cyan-100 text-cyan-800',
        'Huyền Thoại': 'bg-orange-100 text-orange-800'
    };
    return colors[tierName] || 'bg-gray-100 text-gray-800';
};

const Readers = () => {
    const navigate = useNavigate();
    const [readers, setReaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedReader, setSelectedReader] = useState(null);
    const [tiers, setTiers] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        gender: 'male',
        phone: '',
        email: '',
        address: '',
        id_card: '',
        tier_id: 1
    });

    useEffect(() => {
        loadReaders();
        loadTiers();
    }, []);

    const loadReaders = async () => {
        try {
            const response = await readerService.getAll();
            setReaders(response.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách độc giả');
        } finally {
            setLoading(false);
        }
    };

    const loadTiers = async () => {
        try {
            const response = await readerService.getTiers();
            setTiers(response.data || []);
        } catch (error) {
            console.error('Error loading tiers:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            loadReaders();
            return;
        }

        try {
            const response = await readerService.search(searchTerm);
            setReaders(response.data || []);
        } catch (error) {
            toast.error('Tìm kiếm thất bại');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await readerService.create(formData);
            toast.success('Thêm độc giả thành công');
            setShowAddModal(false);
            setFormData({
                full_name: '',
                date_of_birth: '',
                gender: 'male',
                phone: '',
                email: '',
                address: '',
                id_card: '',
                tier_id: 1
            });
            loadReaders();
        } catch (error) {
            toast.error('Thêm độc giả thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa độc giả này?')) return;

        try {
            await readerService.delete(id);
            toast.success('Xóa độc giả thành công');
            loadReaders();
        } catch (error) {
            toast.error('Xóa độc giả thất bại');
        }
    };

    const handleEditClick = (reader) => {
        setSelectedReader(reader);
        setFormData({
            full_name: reader.full_name || '',
            date_of_birth: reader.date_of_birth
                ? reader.date_of_birth.split('T')[0]
                : '',
            gender: reader.gender || 'male',
            phone: reader.phone || '',
            email: reader.email || '',
            address: reader.address || '',
            id_card: reader.id_card || '',
            tier_id: reader.tier_id || 1
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await readerService.update(selectedReader.reader_id, formData);
            toast.success('Cập nhật độc giả thành công');
            setShowEditModal(false);
            setSelectedReader(null);
            loadReaders();
        } catch (error) {
            toast.error('Cập nhật độc giả thất bại');
        }
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
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        Quản lý Độc giả
                    </h1>
                    <p className='text-gray-500 mt-1'>
                        Danh sách độc giả và thông tin thành viên
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className='btn-primary gap-2'
                >
                    <RiAddLine className='w-5 h-5' />
                    Thêm độc giả
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className='flex gap-3'>
                <div className='relative flex-1 max-w-md'>
                    <RiSearchLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                        type='text'
                        placeholder='Tìm theo tên, SĐT, email, mã thẻ...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                    />
                </div>
                <button type='submit' className='btn-secondary'>
                    Tìm kiếm
                </button>
            </form>

            {/* Table */}
            <div className='card overflow-x-auto'>
                <table className='w-full min-w-[900px]'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='table-header'>Mã thẻ</th>
                            <th className='table-header'>Họ tên</th>
                            <th className='table-header'>Liên hệ</th>
                            <th className='table-header'>Cấp độ</th>
                            <th className='table-header'>Đang mượn</th>
                            <th className='table-header'>Quá hạn</th>
                            <th className='table-header'>Ngày đăng ký</th>
                            <th className='table-header'>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                        {readers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan='8'
                                    className='px-6 py-12 text-center text-gray-500'
                                >
                                    Không tìm thấy độc giả nào
                                </td>
                            </tr>
                        ) : (
                            readers.map((reader) => (
                                <tr
                                    key={reader.reader_id}
                                    className='hover:bg-gray-50'
                                >
                                    <td className='table-cell font-medium'>
                                        {reader.card_number}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center'>
                                                <span className='text-sm font-medium text-primary-600'>
                                                    {reader.full_name.charAt(0)}
                                                </span>
                                            </div>
                                            <span className='font-medium'>
                                                {reader.full_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <div className='space-y-1'>
                                            <div className='flex items-center gap-1 text-sm'>
                                                <RiPhoneLine className='w-4 h-4 text-gray-400' />
                                                {reader.phone}
                                            </div>
                                            {reader.email && (
                                                <div className='flex items-center gap-1 text-sm text-gray-500'>
                                                    <RiMailLine className='w-4 h-4' />
                                                    {reader.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <span
                                            className={`badge ${getTierBg(reader.tier_name)}`}
                                        >
                                            <RiVipCrownLine className='w-3 h-3 mr-1' />
                                            {reader.tier_name}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <span className='font-medium'>
                                            {reader.current_borrows}
                                        </span>
                                        <span className='text-gray-500 text-sm'>
                                            {' '}
                                            / {reader.max_books}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        {reader.overdue_books > 0 ? (
                                            <span className='badge bg-red-100 text-red-800'>
                                                {reader.overdue_books} cuốn
                                            </span>
                                        ) : (
                                            <span className='text-gray-500'>
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className='table-cell text-gray-500'>
                                        {format(
                                            new Date(reader.registered_at),
                                            'dd/MM/yyyy',
                                            { locale: vi }
                                        )}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/readers/${reader.reader_id}`
                                                    )
                                                }
                                                className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                                                title='Xem chi tiết'
                                            >
                                                <RiEyeLine className='w-5 h-5' />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEditClick(reader)
                                                }
                                                className='p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                                                title='Chỉnh sửa'
                                            >
                                                <RiEditLine className='w-5 h-5' />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        reader.reader_id
                                                    )
                                                }
                                                className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                                                title='Xóa'
                                            >
                                                <RiDeleteBinLine className='w-5 h-5' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-gray-900'>
                                    Thêm độc giả mới
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className='p-2 hover:bg-gray-100 rounded-lg'
                                >
                                    <RiCloseLine className='w-5 h-5' />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Họ và tên *
                                    </label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.full_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                full_name: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Ngày sinh
                                    </label>
                                    <input
                                        type='date'
                                        value={formData.date_of_birth}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                date_of_birth: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type='tel'
                                        required
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Email
                                    </label>
                                    <input
                                        type='email'
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Giới tính
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                gender: e.target.value
                                            })
                                        }
                                        className='input'
                                    >
                                        <option value='male'>Nam</option>
                                        <option value='female'>Nữ</option>
                                        <option value='other'>Khác</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Cấp độ thành viên
                                    </label>
                                    <select
                                        value={formData.tier_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tier_id: parseInt(
                                                    e.target.value
                                                )
                                            })
                                        }
                                        className='input'
                                    >
                                        {tiers.map((tier) => (
                                            <option
                                                key={tier.tier_id}
                                                value={tier.tier_id}
                                            >
                                                {tier.tier_name} (Tối đa{' '}
                                                {tier.max_books} sách)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Địa chỉ
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            address: e.target.value
                                        })
                                    }
                                    className='input'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Số CMND/CCCD
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.id_card}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                id_card: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddModal(false)}
                                    className='btn-secondary'
                                >
                                    Hủy
                                </button>
                                <button type='submit' className='btn-primary'>
                                    Thêm độc giả
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedReader && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-gray-900'>
                                    Chỉnh sửa độc giả
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className='p-2 hover:bg-gray-100 rounded-lg'
                                >
                                    <RiCloseLine className='w-5 h-5' />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdate} className='p-6 space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Họ và tên *
                                    </label>
                                    <input
                                        type='text'
                                        required
                                        value={formData.full_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                full_name: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Ngày sinh
                                    </label>
                                    <input
                                        type='date'
                                        value={formData.date_of_birth}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                date_of_birth: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type='tel'
                                        required
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Email
                                    </label>
                                    <input
                                        type='email'
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Giới tính
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                gender: e.target.value
                                            })
                                        }
                                        className='input'
                                    >
                                        <option value='male'>Nam</option>
                                        <option value='female'>Nữ</option>
                                        <option value='other'>Khác</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Cấp độ thành viên
                                    </label>
                                    <select
                                        value={formData.tier_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tier_id: parseInt(
                                                    e.target.value
                                                )
                                            })
                                        }
                                        className='input'
                                    >
                                        {tiers.map((tier) => (
                                            <option
                                                key={tier.tier_id}
                                                value={tier.tier_id}
                                            >
                                                {tier.tier_name} (Tối đa{' '}
                                                {tier.max_books} sách)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Địa chỉ
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            address: e.target.value
                                        })
                                    }
                                    className='input'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Số CMND/CCCD
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.id_card}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                id_card: e.target.value
                                            })
                                        }
                                        className='input'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setShowEditModal(false)}
                                    className='btn-secondary'
                                >
                                    Hủy
                                </button>
                                <button type='submit' className='btn-primary'>
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Readers;
