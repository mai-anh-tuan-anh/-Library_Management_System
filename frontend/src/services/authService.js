import api from './api';

const authService = {
    login: (email, password) => {
        return api.post('/auth/login', { email, password });
    },

    register: (data) => {
        return api.post('/auth/register', data);
    },

    getMe: () => {
        return api.get('/auth/me');
    },

    changePassword: (currentPassword, newPassword) => {
        return api.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    }
};

export default authService;
