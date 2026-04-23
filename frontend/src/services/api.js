import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Phiên đăng nhập đã hết hạn');
    } else if (error.response?.status === 403) {
      toast.error('Bạn không có quyền thực hiện hành động này');
    } else if (error.response?.status === 404) {
      toast.error('Không tìm thấy dữ liệu');
    } else if (error.response?.status >= 500) {
      toast.error('Lỗi máy chủ, vui lòng thử lại sau');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
