import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', {
                        email,
                        password
                    });
                    const { user, token } = response.data.data;

                    // Extract role from user.roles array
                    const userRole =
                        user.roles && user.roles.length > 0
                            ? user.roles[0]
                            : 'reader';

                    localStorage.setItem('token', token);
                    set({
                        user: { ...user, role: userRole },
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true;
                } catch (error) {
                    set({
                        error:
                            error.response?.data?.message ||
                            'Đăng nhập thất bại',
                        isLoading: false
                    });
                    return false;
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, isAuthenticated: false, error: null });
            },

            clearError: () => set({ error: null }),

            updateUser: (userData) => {
                set({ user: { ...get().user, ...userData } });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);
