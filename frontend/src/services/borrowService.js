import api from './api';

const borrowService = {
    // Get all borrow transactions
    getAll: async (params = {}) => {
        const response = await api.get('/borrowings', { params });
        return response.data;
    },

    // Get transaction by ID
    getById: async (id) => {
        const response = await api.get(`/borrowings/${id}`);
        return response.data;
    },

    // Create new borrowing transaction
    create: async (data) => {
        const response = await api.post('/borrowings', data);
        return response.data;
    },

    // Cancel transaction
    cancel: async (id, reason) => {
        const response = await api.post(`/borrowings/${id}/cancel`, { reason });
        return response.data;
    },

    // Process return
    processReturn: async (data) => {
        const response = await api.post('/returns', data);
        return response.data;
    },

    // Pay fine
    payFine: async (returnId, paymentMethodId) => {
        const response = await api.post(`/returns/${returnId}/pay-fine`, {
            paymentMethodId
        });
        return response.data;
    },

    // Get due alerts
    getDueAlerts: async () => {
        const response = await api.get('/borrowings/due-alerts');
        return response.data;
    },

    // Get overdue books
    getOverdue: async () => {
        const response = await api.get('/borrowings/overdue');
        return response.data;
    },

    // Get damage types
    getDamageTypes: async () => {
        const response = await api.get('/borrowings/damage-types');
        return response.data;
    },

    // Get payment methods
    getPaymentMethods: async () => {
        const response = await api.get('/borrowings/payment-methods');
        return response.data;
    },

    // Send reminder
    sendReminder: async (transactionId, daysRemaining) => {
        const response = await api.post(`/borrowings/${transactionId}/remind`, {
            daysRemaining
        });
        return response.data;
    }
};

export default borrowService;
