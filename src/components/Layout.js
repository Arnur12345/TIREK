import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    RiDashboardLine, 
    RiFileList3Line, 
    RiUserLine, 
    RiBuilding4Line,
    RiLogoutBoxRLine,
    RiMenuFoldLine,
    RiMenuUnfoldLine,
} from 'react-icons/ri';
import { useState } from 'react';
import './Dashboard.css';
import tirekNoText from '../assets/smartkyozlogo.png';
import tirekLogo from '../assets/smartkyozlogo.png';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('login');

    const menuItems = [
        { path: '/dashboard', icon: <RiDashboardLine />, text: 'Обзор' },
        { path: '/events', icon: <RiFileList3Line />, text: 'Журнал событий' },
        { path: '/students', icon: <RiUserLine />, text: 'Ученики' },
        ...(userRole === 'ADMIN' ? [{ path: '/schools', icon: <RiBuilding4Line />, text: 'Организации' }] : []),
        { path: '/face_encodings', icon: <RiUserLine />, text: 'Идентификация лиц' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} 
                           transition-all duration-300 ease-in-out 
                           bg-blue-800 text-white fixed h-full shadow-xl z-50`}>
                
                {/* Toggle Button */}
                <button 
                    onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-4 transform
                               bg-white text-blue-800 rounded-full p-2.5 shadow-lg
                               hover:bg-blue-50 transition-all duration-200"
                >
                    {isSidebarCollapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
                </button>

                {/* Logo */}
                <div className={`p-8 ${isSidebarCollapsed ? 'text-center' : ''}`}>
                    <img 
                        src={isSidebarCollapsed ? tirekNoText : tirekLogo} 
                        alt="TIREK Logo"
                        className={`transition-all duration-200 brightness-0 invert
                                  ${isSidebarCollapsed ? 'w-16 h-auto' : 'w-48 h-auto'}`}
                    />
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-4">
                    {menuItems.map((item) => (
                        <div
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center px-4 py-3.5 my-1 cursor-pointer
                                      rounded-lg transition-all duration-200 
                                      ${location.pathname === item.path 
                                        ? 'bg-white/20 text-white shadow-md' 
                                        : 'hover:bg-white/10'}`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            {!isSidebarCollapsed && (
                                <span className="ml-4 font-medium">{item.text}</span>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-8 w-full px-4">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}
                        className={`flex items-center justify-center w-full 
                                  py-3 text-white bg-red-500 rounded-lg
                                  hover:bg-red-600 transition-all duration-200
                                  shadow-lg hover:shadow-xl`}
                    >
                        <RiLogoutBoxRLine className="text-xl" />
                        {!isSidebarCollapsed && <span className="ml-2 font-medium">Выйти</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 
                           ${isSidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
                <div className="min-h-screen">
                    {/* Top Bar */}
                    <div className="bg-white shadow-sm sticky top-0 z-40">
                        <div className="flex justify-end items-center h-20 px-8">
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">{username}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{userRole}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-600
                                            flex items-center justify-center text-white font-medium shadow-lg">
                                    {username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="p-8 bg-gray-50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
