import api from './api';

const bookService = {
    // Get all books with pagination and filters
    getAll: async (params = {}) => {
        const response = await api.get('/books', { params });
        return response.data;
    },

    // Get book by ID
    getById: async (id) => {
        const response = await api.get(`/books/${id}`);
        return response.data;
    },

    // Get book copies
    getCopies: async (id) => {
        const response = await api.get(`/books/${id}/copies`);
        return response.data;
    },

    // Create new book
    create: async (data) => {
        const response = await api.post('/books', data);
        return response.data;
    },

    // Update book
    update: async (id, data) => {
        const response = await api.put(`/books/${id}`, data);
        return response.data;
    },

    // Soft delete book
    delete: async (id) => {
        const response = await api.delete(`/books/${id}`);
        return response.data;
    },

    // Add book copy
    addCopy: async (bookId, data) => {
        const response = await api.post(`/books/${bookId}/copies`, data);
        return response.data;
    },

    // Update copy status
    updateCopy: async (copyId, data) => {
        const response = await api.put(`/books/book-copies/${copyId}`, data);
        return response.data;
    },

    // Delete book copy
    deleteCopy: async (bookId, copyId) => {
        const response = await api.delete(`/books/${bookId}/copies/${copyId}`);
        return response.data;
    },

    // Get categories
    getCategories: async () => {
        const response = await api.get('/books/categories');
        return response.data;
    },

    // Get authors
    getAuthors: async () => {
        const response = await api.get('/books/authors');
        return response.data;
    },

    // Get publishers
    getPublishers: async () => {
        const response = await api.get('/books/publishers');
        return response.data;
    },

    // Search books by barcode
    searchByBarcode: async (barcode) => {
        const response = await api.get('/books/book-copies/search', {
            params: { barcode }
        });
        return response.data;
    }
};

export default bookService;
