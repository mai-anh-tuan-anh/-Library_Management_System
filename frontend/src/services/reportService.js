import api from './api';

const reportService = {
  // Get revenue by day
  getRevenueDaily: async (params = {}) => {
    const response = await api.get('/reports/revenue/daily', { params });
    return response.data;
  },

  // Get revenue by week
  getRevenueWeekly: async (params = {}) => {
    const response = await api.get('/reports/revenue/weekly', { params });
    return response.data;
  },

  // Get revenue by month
  getRevenueMonthly: async (params = {}) => {
    const response = await api.get('/reports/revenue/monthly', { params });
    return response.data;
  },

  // Get top books
  getTopBooks: async (limit = 10) => {
    const response = await api.get('/reports/top-books', { params: { limit } });
    return response.data;
  },

  // Get top readers
  getTopReaders: async (limit = 10) => {
    const response = await api.get('/reports/top-readers', { params: { limit } });
    return response.data;
  },

  // Get inventory status
  getInventory: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Export report
  exportReport: async (type, params = {}) => {
    const response = await api.get(`/reports/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};

export default reportService;
