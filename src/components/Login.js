import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/smartkoz.png';
import config from '../config'; // Importing the config file for the base API URL

const Login = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${config.apiBaseUrl}/login`, {
                login,
                password,
            });

            // Save data to localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('login', response.data.login);
            localStorage.setItem('user_role', response.data.user_role);

            // Redirect the user to the dashboard
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('Login error:', err.response?.data || err.message);
            setError('Invalid credentials! Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="mb-8">
                <img src={logo} alt="SmartKoz Logo" className="w-30 h-30 mx-auto sm:w-28 sm:h-28 drop-shadow-lg" />
            </div>

            {/* Heading */}
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight mb-6 sm:text-5xl">
                Вход в систему
            </h2>
            <p className="text-sm text-gray-600 mb-8 sm:text-base">
                Добро пожаловать! Пожалуйста, введите ваши учетные данные для продолжения.
            </p>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 mb-6 w-full max-w-sm">
                    {error}
                </div>
            )}

            {/* Login Form */}
            <form
                onSubmit={handleLogin}
                className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm space-y-6 border border-gray-100"
            >
                {/* Login Field */}
                <div>
                    <label
                        htmlFor="login"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Логин
                    </label>
                    <input
                        type="text"
                        id="login"
                        placeholder="Введите ваш логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Password Field */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Пароль
                    </label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Введите ваш пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-2 text-white font-medium rounded-md transition ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md'
                    }`}
                >
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </div>
    );
};

export default Login;
