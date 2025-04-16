import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs';
import config from "../config";
import { 
    RiUserLine, 
    RiBuilding2Line, 
    RiCalendarEventLine,
    RiLineChartLine,
    RiSearchLine
} from 'react-icons/ri';
import Layout from './Layout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [user, setUser] = useState({ name: '' });
    const [studentCount, setStudentCount] = useState(0);
    const [eventCount, setEventCount] = useState(0);
    const [schoolCount, setSchoolCount] = useState(0);
    const [entranceLogs, setEntranceLogs] = useState([0, 0, 0, 0, 0, 0, 0]);
    const navigate = useNavigate();

    const userRole = localStorage.getItem('user_role'); // e.g., "ADMIN" or "STAFF"
    const username = localStorage.getItem('login');

    // Fetch the username from localStorage
    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            setUser({ name: username });
        }
    }, []);

    // Fetch the student count from the backend
    useEffect(() => {
        const fetchStudentCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${config.apiBaseUrl}/students/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setStudentCount(response.data.student_count);
            } catch (error) {
                console.error("Error fetching student count:", error);
            }
        };

        fetchStudentCount();
    }, []);

    // Fetch the event count from the backend
    useEffect(() => {
        const fetchEventCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${config.apiBaseUrl}/events/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEventCount(response.data.event_count);
            } catch (error) {
                console.error("Error fetching event count:", error);
            }
        };

        fetchEventCount();
    }, []);

    // Fetch the school count from the backend
    useEffect(() => {
        const fetchSchoolCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${config.apiBaseUrl}/schools/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setSchoolCount(response.data.school_count);
            } catch (error) {
                console.error("Error fetching school count:", error);
            }
        };

        fetchSchoolCount();
    }, []);

    // Fetch entrance logs for the past 7 days
    useEffect(() => {
        const fetchEntranceLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${config.apiBaseUrl}/events/weekly`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEntranceLogs(Object.values(response.data));
            } catch (error) {
                console.error("Error fetching entrance logs:", error);
            }
        };

        fetchEntranceLogs();
    }, []);

    // Calculate date range (last 7 days from today)
    const today = dayjs();
    const startDate = today.subtract(6, 'day');
    const labels = [];
    for (let i = 0; i < 7; i++) {
        labels.push(startDate.add(i, 'day').format('DD.MM.YYYY'));
    }
    const handleLogout = () => {
        localStorage.removeItem('token');  // Remove the authentication token
        localStorage.removeItem('username');
        localStorage.removeItem('user_role')  // Remove other user data if stored
        navigate('/login');  // Redirect to login page
    };

    // Options to fix the infinite chart height and improve appearance
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#1e293b',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                bodyFont: {
                    family: "'Inter', sans-serif"
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    weight: 600
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(226, 232, 240, 0.5)'
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b'
                }
            }
        }
    };

    // Prepare data for the Event Rate Line Chart (Amount of entries)
    const entranceRateData = {
        labels: labels,
        datasets: [
            {
                label: 'Количество событий',
                data: entranceLogs,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }
        ]
    };

    // Handle navigation on sidebar clicks
    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Панель управления
                    </h1>
                    <div className="relative w-64">
                        <input 
                            type="text" 
                            placeholder="Поиск..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100
                                  transform hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Организации</p>
                                <h3 className="text-2xl font-bold text-gray-900">{schoolCount}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <RiBuilding2Line className="text-2xl text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100
                                  transform hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Ученики</p>
                                <h3 className="text-2xl font-bold text-gray-900">{studentCount}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <RiUserLine className="text-2xl text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100
                                  transform hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">События</p>
                                <h3 className="text-2xl font-bold text-gray-900">{eventCount}</h3>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <RiCalendarEventLine className="text-2xl text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-gray-500 text-sm">
                    Информация с {startDate.format('DD.MM.YYYY')} до {today.format('DD.MM.YYYY')}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Статистика событий
                        </h3>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <RiLineChartLine className="text-xl text-blue-600" />
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <Line data={entranceRateData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
