import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RiSearchLine,
    RiAddLine,
    RiEditLine,
    RiDeleteBinLine,
    RiEyeLine,
    RiBookLine,
    RiFilterLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import bookService from '../../services/bookService';

const Books = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        loadBooks();
        loadCategories();
    }, []);

    const loadBooks = async () => {
        try {
            const response = await bookService.getAll();
            const data = response.data || [];
            setBooks(data);
            setAllBooks(data);
        } catch (error) {
            toast.error('Không thể tải danh sách sách');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        let filteredBooks = allBooks;

        // Filter by category
        if (selectedCategory) {
            filteredBooks = filteredBooks.filter(
                (book) => book.category_id === parseInt(selectedCategory)
            );
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredBooks = filteredBooks.filter(
                (book) =>
                    (book.title && book.title.toLowerCase().includes(term)) ||
                    (book.isbn && book.isbn.toLowerCase().includes(term)) ||
                    (book.book_code &&
                        book.book_code.toLowerCase().includes(term))
            );
        }

        setBooks(filteredBooks);
    };

    const loadCategories = async () => {
        try {
            const response = await bookService.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    const handleEdit = (bookId) => {
        navigate(`/books/${bookId}/edit`);
    };

    const handleDelete = async (bookId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sách này?')) {
            return;
        }
        try {
            await bookService.delete(bookId);
            toast.success('Xóa sách thành công');
            loadBooks();
        } catch (error) {
            toast.error('Xóa sách thất bại');
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
                        Quản lý Sách
                    </h1>
                    <p className='text-gray-500 mt-1'>
                        Danh sách sách và quản lý kho
                    </p>
                </div>
                <button
                    onClick={() => navigate('/books/new')}
                    className='btn-primary gap-2'
                >
                    <RiAddLine className='w-5 h-5' />
                    Thêm sách mới
                </button>
            </div>

            {/* Search & Filter */}
            <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1 max-w-md'>
                    <RiSearchLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                        type='text'
                        placeholder='Tìm theo tên sách, ISBN, mã sách...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className='px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                    <option value=''>Tất cả danh mục</option>
                    {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                        </option>
                    ))}
                </select>
                <button onClick={handleFilter} className='btn-secondary gap-2'>
                    <RiFilterLine className='w-5 h-5' />
                    Lọc
                </button>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                            <RiBookLine className='w-5 h-5 text-blue-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>{books.length}</p>
                            <p className='text-sm text-gray-500'>Đầu sách</p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                            <RiBookLine className='w-5 h-5 text-green-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {books.reduce(
                                    (acc, b) => acc + (b.total_copies || 0),
                                    0
                                )}
                            </p>
                            <p className='text-sm text-gray-500'>
                                Tổng bản sao
                            </p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-purple-100 rounded-lg'>
                            <RiBookLine className='w-5 h-5 text-purple-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {books.reduce(
                                    (acc, b) => acc + (b.available_copies || 0),
                                    0
                                )}
                            </p>
                            <p className='text-sm text-gray-500'>Có sẵn</p>
                        </div>
                    </div>
                </div>
                <div className='card p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-yellow-100 rounded-lg'>
                            <RiBookLine className='w-5 h-5 text-yellow-600' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold'>
                                {books.reduce(
                                    (acc, b) =>
                                        acc +
                                        ((b.total_copies || 0) -
                                            (b.available_copies || 0)),
                                    0
                                )}
                            </p>
                            <p className='text-sm text-gray-500'>Đang mượn</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Books Table */}
            <div className='card overflow-x-auto'>
                <table className='w-full min-w-[1000px]'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='table-header'>Sách</th>
                            <th className='table-header'>ISBN</th>
                            <th className='table-header'>Danh mục</th>
                            <th className='table-header'>Giá</th>
                            <th className='table-header'>Tồn kho</th>
                            <th className='table-header'>Trạng thái</th>
                            <th className='table-header'>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                        {books.length === 0 ? (
                            <tr>
                                <td
                                    colSpan='7'
                                    className='px-6 py-12 text-center text-gray-500'
                                >
                                    Không tìm thấy sách nào
                                </td>
                            </tr>
                        ) : (
                            books.map((book) => (
                                <tr
                                    key={book.book_id}
                                    className='hover:bg-gray-50'
                                >
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-3'>
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image}
                                                    alt={book.title}
                                                    className='w-12 h-16 object-cover rounded'
                                                />
                                            ) : (
                                                <div className='w-12 h-16 bg-gray-200 rounded flex items-center justify-center'>
                                                    <RiBookLine className='w-6 h-6 text-gray-400' />
                                                </div>
                                            )}
                                            <div>
                                                <p className='font-medium text-gray-900'>
                                                    {book.title}
                                                </p>
                                                <p className='text-sm text-gray-500'>
                                                    {book.book_code}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='table-cell font-mono text-sm'>
                                        {book.isbn || '-'}
                                    </td>
                                    <td className='table-cell'>
                                        <span className='badge bg-blue-100 text-blue-800'>
                                            {book.category_name ||
                                                'Chưa phân loại'}
                                        </span>
                                    </td>
                                    <td className='table-cell font-medium'>
                                        {formatCurrency(book.price)}
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <span className='font-medium'>
                                                {book.available_copies || 0}
                                            </span>
                                            <span className='text-gray-400'>
                                                /
                                            </span>
                                            <span className='text-gray-500'>
                                                {book.total_copies || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='table-cell'>
                                        <span
                                            className={`badge ${book.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                        >
                                            {book.is_active
                                                ? 'Đang bán'
                                                : 'Ngừng bán'}
                                        </span>
                                    </td>
                                    <td className='table-cell'>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/books/${book.book_id}`
                                                    )
                                                }
                                                className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg'
                                            >
                                                <RiEyeLine className='w-5 h-5' />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEdit(book.book_id)
                                                }
                                                className='p-2 text-gray-600 hover:bg-gray-100 rounded-lg'
                                                title='Chỉnh sửa'
                                            >
                                                <RiEditLine className='w-5 h-5' />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(book.book_id)
                                                }
                                                className='p-2 text-red-600 hover:bg-red-50 rounded-lg'
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
        </div>
    );
};

export default Books;
