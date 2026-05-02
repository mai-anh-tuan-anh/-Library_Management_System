import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RiMailLine,
    RiLockLine,
    RiEyeLine,
    RiEyeOffLine,
    RiBookLine,
    RiUserAddLine
} from 'react-icons/ri';
import { useAuthStore } from '../../stores/authStore';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const { login, user, isLoading, error, clearError } = useAuthStore();

    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!email || !password) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            const success = await login(email, password);

            if (success) {
                toast.success('Đăng nhập thành công');
                // Get user role from store after login
                const currentUser = useAuthStore.getState().user;
                const isReader = currentUser?.role === 'reader';
                navigate(isReader ? '/books' : '/dashboard');
            } else {
                // Keep form values, just show error
                console.log('[LOGIN] Failed but keeping form state');
            }
        } catch (err) {
            console.error('[LOGIN] Error:', err);
            // Prevent any navigation on error
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        clearError();

        if (!email || !password || !confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setRegisterLoading(true);
        try {
            // Generate full_name from email prefix
            const generatedFullName = email.split('@')[0];
            const response = await authService.register({
                email,
                password,
                full_name: generatedFullName
            });

            if (response.data?.success) {
                toast.success('Đăng ký thành công! Vui lòng đăng nhập');
                setIsRegister(false);
                setPassword('');
                setConfirmPassword('');
            } else {
                toast.error(response.data?.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            console.error('[REGISTER] Error:', err);
            toast.error(err.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className='bg-white rounded-2xl shadow-2xl p-8'>
            {/* Logo */}
            <div className='text-center mb-8'>
                <div className='w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                    <RiBookLine className='w-8 h-8 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-gray-900'>
                    {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
                </h2>
                <p className='text-gray-500 mt-1'>
                    {isRegister
                        ? 'Tạo tài khoản để xem sách trong thư viện'
                        : 'Vui lòng đăng nhập để tiếp tục'}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-600'>{error}</p>
                </div>
            )}

            {/* Form */}
            <form
                onSubmit={isRegister ? handleRegister : handleSubmit}
                className='space-y-5'
            >
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                        Email
                    </label>
                    <div className='relative'>
                        <RiMailLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                        <input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                            placeholder='admin@library.vn'
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                        Mật khẩu
                    </label>
                    <div className='relative'>
                        <RiLockLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                            placeholder='••••••••'
                            required
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                        >
                            {showPassword ? (
                                <RiEyeOffLine className='w-5 h-5' />
                            ) : (
                                <RiEyeLine className='w-5 h-5' />
                            )}
                        </button>
                    </div>
                </div>

                {isRegister && (
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                            Xác nhận mật khẩu
                        </label>
                        <div className='relative'>
                            <RiLockLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className='w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                placeholder='••••••••'
                                required
                            />
                            <button
                                type='button'
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            >
                                {showConfirmPassword ? (
                                    <RiEyeOffLine className='w-5 h-5' />
                                ) : (
                                    <RiEyeLine className='w-5 h-5' />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type='submit'
                    disabled={isLoading || registerLoading}
                    className='w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                    {isRegister
                        ? registerLoading
                            ? 'Đang đăng ký...'
                            : 'Đăng ký'
                        : isLoading
                          ? 'Đang đăng nhập...'
                          : 'Đăng nhập'}
                </button>
            </form>

            {/* Toggle Register/Login */}
            <div className='mt-6 text-center'>
                <p className='text-sm text-gray-600'>
                    {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                    <button
                        type='button'
                        onClick={() => {
                            setIsRegister(!isRegister);
                            clearError();
                        }}
                        className='ml-1 text-primary-600 hover:text-primary-700 font-medium'
                    >
                        {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
                    </button>
                </p>
            </div>

            {/* Demo Credentials - Only show for login */}
            {!isRegister && (
                <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
                    <p className='text-xs text-gray-500 text-center'>
                        <strong>Demo Admin:</strong> admin@library.vn / admin123
                    </p>
                </div>
            )}
        </div>
    );
};

export default Login;
