import api from './api';

const readerService = {
    // Get all readers with pagination and filters
    getAll: async (params = {}) => {
        const response = await api.get('/readers', { params });
        return response.data;
    },

    // Search readers
    search: async (searchTerm) => {
        const response = await api.get('/readers/search', {
            params: { q: searchTerm }
        });
        return response.data;
    },

    // Get reader by ID
    getById: async (id) => {
        const response = await api.get(`/readers/${id}`);
        return response.data;
    },

    // Get reader current borrows
    getCurrentBorrows: async (id) => {
        const response = await api.get(`/readers/${id}/borrows`);
        return response.data;
    },

    // Get reader borrowing history (all transactions)
    getBorrowHistory: async (id) => {
        const response = await api.get(`/readers/${id}/history`);
        return response.data;
    },

    // Create new reader
    create: async (data) => {
        const response = await api.post('/readers', data);
        return response.data;
    },

    // Update reader
    update: async (id, data) => {
        const response = await api.put(`/readers/${id}`, data);
        return response.data;
    },

    // Soft delete reader
    delete: async (id) => {
        const response = await api.delete(`/readers/${id}`);
        return response.data;
    },

    // Restore reader
    restore: async (id) => {
        const response = await api.post(`/readers/${id}/restore`);
        return response.data;
    },

    // Get membership tiers
    getTiers: async () => {
        const response = await api.get('/readers/membership-tiers');
        return response.data;
    },

    // Upgrade/Downgrade membership
    changeTier: async (id, tierId, reason) => {
        const response = await api.post(`/readers/${id}/change-tier`, {
            tierId,
            reason
        });
        return response.data;
    }
};

export default readerService;
