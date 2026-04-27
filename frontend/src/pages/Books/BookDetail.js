import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    RiArrowLeftLine,
    RiBookLine,
    RiBarcodeLine,
    RiEditLine,
    RiAddLine,
    RiCloseLine,
    RiDeleteBinLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import bookService from '../../services/bookService';

const BookDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [copies, setCopies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCopyModal, setShowAddCopyModal] = useState(false);
    const [showEditCopyModal, setShowEditCopyModal] = useState(false);
    const [editingCopy, setEditingCopy] = useState(null);
    const [copyFormData, setCopyFormData] = useState({
        barcode: '',
        location_code: '',
        condition_status: 'good',
        acquisition_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadBookData();
    }, [id]);

    const loadBookData = async () => {
        try {
            const [bookRes, copiesRes] = await Promise.all([
                bookService.getById(id),
                bookService.getCopies(id)
            ]);

            setBook(bookRes.data);
            setCopies(copiesRes.data || []);
        } catch (error) {
            toast.error('Không thể tải thông tin sách');
            navigate('/books');
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

    const getStatusBadge = (status) => {
        const styles = {
            available: 'bg-green-100 text-green-800',
            borrowed: 'bg-blue-100 text-blue-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            lost: 'bg-red-100 text-red-800'
        };
        const labels = {
            available: 'Có sẵn',
            borrowed: 'Đang mượn',
            maintenance: 'Bảo trì',
            lost: 'Mất'
        };
        return (
            <span className={`badge ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const handleAddCopy = async (e) => {
        e.preventDefault();
        try {
            await bookService.addCopy(id, copyFormData);
            toast.success('Thêm bản sao thành công');
            setShowAddCopyModal(false);
            setCopyFormData({
                barcode: '',
                location_code: '',
                condition_status: 'good',
                acquisition_date: new Date().toISOString().split('T')[0]
            });
            loadBookData();
        } catch (error) {
            toast.error('Thêm bản sao thất bại');
        }
    };

    const openEditCopyModal = (copy) => {
        setEditingCopy(copy);
        setCopyFormData({
            barcode: copy.barcode || '',
            location_code: copy.location_code || '',
            condition_status: copy.condition_status || 'good',
            acquisition_date: copy.acquisition_date
                ? new Date(copy.acquisition_date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
        });
        setShowEditCopyModal(true);
    };

    const closeEditCopyModal = () => {
        setShowEditCopyModal(false);
        setEditingCopy(null);
        setCopyFormData({
            barcode: '',
            location_code: '',
            condition_status: 'good',
            acquisition_date: new Date().toISOString().split('T')[0]
        });
    };

    const handleEditCopy = async (e) => {
        e.preventDefault();
        if (!editingCopy) return;

        try {
            await bookService.updateCopy(editingCopy.copy_id, copyFormData);
            toast.success('Cập nhật bản sao thành công');
            closeEditCopyModal();
            loadBookData();
        } catch (error) {
            toast.error('Cập nhật bản sao thất bại');
        }
    };

    const handleDeleteCopy = async (copyId) => {
        if (
            !window.confirm(
                'Bạn có chắc chắn muốn xóa bản sao này? Hành động này không thể hoàn tác.'
            )
        ) {
            return;
        }
        try {
            await bookService.deleteCopy(id, copyId);
            toast.success('Đã xóa bản sao thành công');
            loadBookData();
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Không thể xóa bản sao'
            );
        }
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
        );
    }

    if (!book) return null;

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <button
                    onClick={() => navigate('/books')}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                    <RiArrowLeftLine className='w-5 h-5' />
                </button>
                <div className='flex-1'>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        {book.title}
                    </h1>
                    <p className='text-gray-500'>
                        {book.book_code} • {book.isbn || 'Chưa có ISBN'}
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/books/${id}/edit`)}
                    className='btn-secondary gap-2'
                >
                    <RiEditLine className='w-5 h-5' />
                    Chỉnh sửa
                </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Book Info */}
                <div className='lg:col-span-2 space-y-6'>
                    <div className='card p-6'>
                        <div className='flex gap-6'>
                            {book.cover_image ? (
                                <img
                                    src={book.cover_image}
                                    alt={book.title}
                                    className='w-32 h-48 object-cover rounded-lg'
                                />
                            ) : (
                                <div className='w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center'>
                                    <RiBookLine className='w-12 h-12 text-gray-400' />
                                </div>
                            )}
                            <div className='flex-1 space-y-4'>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Tiêu đề
                                    </label>
                                    <p className='font-medium text-lg'>
                                        {book.title}
                                    </p>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-sm text-gray-500'>
                                            Tác giả
                                        </label>
                                        <p className='font-medium'>
                                            {book.author || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500'>
                                            Nhà xuất bản
                                        </label>
                                        <p className='font-medium'>
                                            {book.publisher_name ||
                                                'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500'>
                                            Danh mục
                                        </label>
                                        <p className='font-medium'>
                                            {book.category_name ||
                                                'Chưa phân loại'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500'>
                                            Năm xuất bản
                                        </label>
                                        <p className='font-medium'>
                                            {book.publish_year || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm text-gray-500'>
                                            Ngôn ngữ
                                        </label>
                                        <p className='font-medium'>
                                            {book.language === 'vi' &&
                                                'Tiếng Việt'}
                                            {book.language === 'en' &&
                                                'Tiếng Anh'}
                                            {book.language === 'zh' &&
                                                'Tiếng Trung'}
                                            {book.language === 'ja' &&
                                                'Tiếng Nhật'}
                                            {book.language === 'ko' &&
                                                'Tiếng Hàn'}
                                            {book.language === 'fr' &&
                                                'Tiếng Pháp'}
                                            {book.language === 'de' &&
                                                'Tiếng Đức'}
                                            {book.language === 'other' &&
                                                'Khác'}
                                            {!book.language && 'Tiếng Việt'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className='text-sm text-gray-500'>
                                        Tóm tắt
                                    </label>
                                    <p className='text-gray-700'>
                                        {book.summary || 'Chưa có tóm tắt'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copies List */}
                    <div className='card overflow-hidden'>
                        <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                                Danh sách bản sao ({copies.length})
                            </h3>
                            <button
                                onClick={() => setShowAddCopyModal(true)}
                                className='btn-primary gap-2 text-sm'
                            >
                                <RiAddLine className='w-4 h-4' />
                                Thêm bản sao
                            </button>
                        </div>
                        <table className='w-full'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='table-header'>Barcode</th>
                                    <th className='table-header'>Vị trí</th>
                                    <th className='table-header'>Tình trạng</th>
                                    <th className='table-header'>Trạng thái</th>
                                    <th className='table-header'>Ngày nhập</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {copies.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan='5'
                                            className='px-6 py-8 text-center text-gray-500'
                                        >
                                            Chưa có bản sao nào
                                        </td>
                                    </tr>
                                ) : (
                                    copies.map((copy) => (
                                        <tr
                                            key={copy.copy_id}
                                            className='hover:bg-gray-50'
                                        >
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-900'>
                                                {copy.barcode}
                                            </td>
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-900'>
                                                {copy.location_code || '-'}
                                            </td>
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-900'>
                                                <span className='badge bg-gray-100 text-gray-800'>
                                                    {copy.condition_status}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-900'>
                                                {getStatusBadge(copy.status)}
                                            </td>
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-500'>
                                                {copy.acquisition_date || '-'}
                                            </td>
                                            <td className='px-4 py-3 text-left text-xs font-medium text-gray-900'>
                                                <button
                                                    onClick={() =>
                                                        openEditCopyModal(copy)
                                                    }
                                                    className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                                                >
                                                    <RiEditLine className='w-4 h-4' />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCopy(
                                                            copy.copy_id
                                                        )
                                                    }
                                                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                                                    title='Xóa bản sao'
                                                >
                                                    <RiDeleteBinLine className='w-4 h-4' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='space-y-6'>
                    <div className='card p-6'>
                        <h3 className='font-semibold text-gray-900 mb-4'>
                            Thông tin giá
                        </h3>
                        <div className='space-y-3'>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>Giá bìa</span>
                                <span className='font-semibold'>
                                    {formatCurrency(book.price)}
                                </span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-500'>
                                    Phí mượn/ngày
                                </span>
                                <span className='font-semibold'>
                                    {formatCurrency(book.borrow_price_per_day)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className='card p-6'>
                        <h3 className='font-semibold text-gray-900 mb-4'>
                            Thống kê tồn kho
                        </h3>
                        <div className='grid grid-cols-2 gap-4 text-center'>
                            <div className='p-3 bg-blue-50 rounded-lg'>
                                <p className='text-2xl font-bold text-blue-600'>
                                    {book.total_copies || 0}
                                </p>
                                <p className='text-sm text-gray-600'>
                                    Tổng bản sao
                                </p>
                            </div>
                            <div className='p-3 bg-green-50 rounded-lg'>
                                <p className='text-2xl font-bold text-green-600'>
                                    {book.available_copies || 0}
                                </p>
                                <p className='text-sm text-gray-600'>Có sẵn</p>
                            </div>
                            <div className='p-3 bg-purple-50 rounded-lg'>
                                <p className='text-2xl font-bold text-purple-600'>
                                    {(book.total_copies || 0) -
                                        (book.available_copies || 0)}
                                </p>
                                <p className='text-sm text-gray-600'>
                                    Đang mượn
                                </p>
                            </div>
                            <div className='p-3 bg-yellow-50 rounded-lg'>
                                <p className='text-2xl font-bold text-yellow-600'>
                                    {book.available_copies > 0
                                        ? Math.round(
                                              (book.available_copies /
                                                  book.total_copies) *
                                                  100
                                          )
                                        : 0}
                                    %
                                </p>
                                <p className='text-sm text-gray-600'>
                                    Tỷ lệ có sẵn
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Copy Modal */}
            {showAddCopyModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-lg'>
                        <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                            <h2 className='text-xl font-bold text-gray-900'>
                                Thêm bản sao mới
                            </h2>
                            <button
                                onClick={() => setShowAddCopyModal(false)}
                                className='p-2 hover:bg-gray-100 rounded-lg'
                            >
                                <RiCloseLine className='w-5 h-5' />
                            </button>
                        </div>

                        <form
                            onSubmit={handleAddCopy}
                            className='p-6 space-y-4'
                        >
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Barcode{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={copyFormData.barcode}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            barcode: e.target.value
                                        })
                                    }
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    placeholder='VD: LIB-001-001'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Vị trí (Kệ sách)
                                </label>
                                <input
                                    type='text'
                                    value={copyFormData.location_code}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            location_code: e.target.value
                                        })
                                    }
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    placeholder='VD: A-01-02'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Tình trạng
                                    </label>
                                    <select
                                        value={copyFormData.condition_status}
                                        onChange={(e) =>
                                            setCopyFormData({
                                                ...copyFormData,
                                                condition_status: e.target.value
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    >
                                        <option value='new'>Mới</option>
                                        <option value='good'>Tốt</option>
                                        <option value='fair'>Khá</option>
                                        <option value='poor'>Xấu</option>
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Ngày nhập
                                    </label>
                                    <input
                                        type='date'
                                        value={copyFormData.acquisition_date}
                                        onChange={(e) =>
                                            setCopyFormData({
                                                ...copyFormData,
                                                acquisition_date: e.target.value
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddCopyModal(false)}
                                    className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                                >
                                    Hủy
                                </button>
                                <button type='submit' className='btn-primary'>
                                    Thêm bản sao
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Copy Modal */}
            {showEditCopyModal && editingCopy && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-lg'>
                        <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                            <h2 className='text-lg font-bold text-gray-900'>
                                Chỉnh sửa bản sao
                            </h2>
                            <button
                                onClick={closeEditCopyModal}
                                className='p-2 hover:bg-gray-100 rounded-lg'
                            >
                                <RiCloseLine className='w-5 h-5' />
                            </button>
                        </div>

                        <form
                            onSubmit={handleEditCopy}
                            className='p-6 space-y-4'
                        >
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Barcode{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={copyFormData.barcode}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            barcode: e.target.value
                                        })
                                    }
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    placeholder='Nhập barcode'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Vị trí{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={copyFormData.location_code}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            location_code: e.target.value
                                        })
                                    }
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    placeholder='VD: A-01-02'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Tình trạng
                                </label>
                                <select
                                    value={copyFormData.condition_status}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            condition_status: e.target.value
                                        })
                                    }
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                >
                                    <option value='new'>Mới</option>
                                    <option value='good'>Tốt</option>
                                    <option value='fair'>Trung bình</option>
                                    <option value='poor'>Kém</option>
                                    <option value='damaged'>Hư hỏng</option>
                                </select>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Ngày nhập
                                </label>
                                <input
                                    type='date'
                                    value={copyFormData.acquisition_date}
                                    onChange={(e) =>
                                        setCopyFormData({
                                            ...copyFormData,
                                            acquisition_date: e.target.value
                                        })
                                    }
                                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                />
                            </div>

                            <div className='flex justify-end gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={closeEditCopyModal}
                                    className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                                >
                                    Hủy
                                </button>
                                <button type='submit' className='btn-primary'>
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetail;
