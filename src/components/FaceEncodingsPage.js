import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "./Layout";
import config from "../config";

const FaceEncodingsPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Create animation on initial load
  useEffect(() => {
    setAnimate(true);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${config.apiBaseUrl}/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке списка пользователей:", error.response?.data || error.message);
      setError("Не удалось загрузить список пользователей. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    
    if (selectedFile) {
      // Simulate upload progress for better UX
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 50);
      
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !file) {
      setMessage("Выберите пользователя и загрузите файл.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", selectedUserId);
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");
      await axios.get(`${config.apiBaseUrl}/face_encodings`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("Идентификация лица успешно добавлена!");
      fetchUsers();
      
      // Close modal with delay for better UX
      setTimeout(() => {
        setIsModalOpen(false);
        setPreviewUrl(null);
        setFile(null);
        setSelectedUserId("");
        setUploadProgress(0);
      }, 1500);
    } catch (error) {
      console.error("Ошибка при добавлении идентификации:", error.response?.data || error.message);
      setMessage("Не удалось добавить идентификацию лица.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setFile(null);
    setPreviewUrl(null);
    setMessage("");
    setUploadProgress(0);
    setIsModalOpen(false);
  };

  // Calculate random blur positions for background effect
  const getRandomBlur = (index) => {
    const positions = [
      "top-1/4 left-1/4",
      "top-3/4 right-1/4",
      "bottom-1/2 left-1/3",
      "top-1/2 right-1/3"
    ];
    return positions[index % positions.length];
  };

  return (
    <Layout>
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${getRandomBlur(i)} w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-pulse`}
              style={{ animationDelay: `${i * 0.5}s` }}
            ></div>
          ))}
          <div className="absolute right-0 top-0 h-96 w-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-5xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-5xl opacity-10 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative">
          {/* Page Header with animation */}
          <div 
            className={`flex flex-col md:flex-row justify-between items-center mb-12 transition-all duration-1000 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <div>
              <div className="flex items-center mb-2">
                <div className="w-2 h-12 bg-gradient-to-b from-blue-700 to-indigo-700 rounded-full mr-3"></div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-600">
                  Идентификация лиц
                </h1>
              </div>
              <p className="text-gray-600 max-w-2xl text-lg ml-5 pl-1">
                Управление биометрической идентификацией пользователей в системе
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 text-lg rounded-xl shadow-2xl hover:shadow-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 group"
            >
              <span className="flex items-center">
                <span className="w-8 h-8 mr-2 rounded-lg bg-white bg-opacity-30 flex items-center justify-center transform group-hover:rotate-180 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-medium">Добавить идентификацию</span>
              </span>
            </button>
          </div>

          {/* Display Error or Loading State */}
          {loading && !isModalOpen && (
            <div className="flex justify-center items-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-b-indigo-600 rounded-full animate-spin" style={{ animationDirection: "reverse" }}></div>
                </div>
              </div>
              <p className="ml-5 text-xl font-medium text-blue-600">Загрузка данных...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-2xl shadow-md transform transition-all animate-fade-in-down">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-red-800">Произошла ошибка</h3>
                  <p className="mt-1 text-red-700">{error}</p>
                  <button 
                    onClick={fetchUsers}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Повторить попытку
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Table */}
          {!loading && !error && (
            <div 
              className={`overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 transition-all duration-1000 ease-out transform ${animate ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              style={{ animationDelay: "0.2s" }}
            >
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Список пользователей
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {users.length} {users.length === 1 ? 'пользователь' : 
                        users.length >= 2 && users.length <= 4 ? 'пользователя' : 'пользователей'} с идентификацией лица
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <svg className="mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Обновлено
                    </span>
                  </div>
                </div>
              </div>
              
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr>
                        <th className="px-8 py-5 text-left font-medium text-sm uppercase tracking-wider text-gray-500 bg-gray-50/80">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Имя пользователя
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user, index) => (
                        <tr 
                          key={index} 
                          className="transform transition-colors hover:bg-blue-50/50 group"
                        >
                          <td className="px-8 py-5 text-gray-800 text-lg flex items-center">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center text-white font-bold mr-5 group-hover:scale-110 transition-transform duration-300">
                                {user.student_name.charAt(0).toUpperCase()}
                              </div>
                              {/* Animation ring on hover */}
                              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-400 group-hover:scale-110 transition-all duration-300"></div>
                            </div>
                            <div>
                              <div className="font-medium">{user.student_name}</div>
                              <div className="text-sm text-gray-500">Идентификация активна</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Нет идентификаций</h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    В системе еще нет пользователей с идентификацией лица. Добавьте первого пользователя, нажав на кнопку выше.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Добавить идентификацию
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add Encoding Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                  className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" 
                  aria-hidden="true"
                  onClick={resetForm}
                ></div>

                {/* Modal position trick */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="relative inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  {/* Decorative elements */}
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transform rotate-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-500 rounded-full shadow-lg"></div>

                  <div className="px-8 pt-6 pb-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-extrabold text-gray-900" id="modal-title">
                        Добавить идентификацию
                      </h2>
                      <button 
                        onClick={resetForm}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none transition-colors"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-8 py-6">
                    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-blue-800 mb-2">
                            Инструкция по добавлению
                          </h3>
                          <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start">
                              <svg className="h-5 w-5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Выберите пользователя из списка.</span>
                            </li>
                            <li className="flex items-start">
                              <svg className="h-5 w-5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Загрузите четкое изображение лица.</span>
                            </li>
                            <li className="flex items-start">
                              <svg className="h-5 w-5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Лицо должно быть направлено прямо в камеру.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-lg font-semibold mb-3 text-gray-800">Выберите пользователя</label>
                        <div className="relative">
                          <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-5 py-4 text-lg rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm"
                            required
                          >
                            <option value="" disabled>
                              Выберите пользователя
                            </option>
                            {users.map((user) => (
                              <option key={user.student_id} value={user.student_id}>
                                {user.student_name}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-lg font-semibold mb-3 text-gray-800">
                          Фотография для идентификации
                        </label>
                        
                        {previewUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75 rounded-2xl transform rotate-6 scale-105 group-hover:rotate-3 transition-transform duration-300"></div>
                              <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-xl w-60 h-60 bg-gray-100">
                                <img 
                                  src={previewUrl} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                                
                                {/* Progress bar overlay */}
                                {uploadProgress < 100 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="w-3/4 bg-gray-200 rounded-full h-4 overflow-hidden">
                                      <div 
                                        className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setFile(null);
                                    setPreviewUrl(null);
                                  }}
                                  className="absolute top-3 right-3 bg-white bg-opacity-80 text-red-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white focus:outline-none transition-colors"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm">
                              <span className="font-medium text-gray-800">{file?.name}</span>
                              {file?.size && ` (${(file.size / 1024).toFixed(1)} KB)`}
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Rainbow border animation */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl opacity-50 blur-sm animate-pulse"></div>
                            <div className="relative border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white hover:border-blue-400 transition-colors duration-300">
                              <input
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                                required
                              />
                              <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center justify-center py-4"
                              >
                                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <p className="text-gray-800 font-semibold text-lg mb-1">Загрузите фотографию</p>
                                <p className="text-gray-500">Перетащите файл или нажмите для выбора</p>
                                <p className="text-blue-600 text-sm mt-2 font-medium">JPEG, PNG, до 5MB</p><p className="text-blue-600 text-sm mt-2 font-medium">JPEG, PNG, до 5MB</p>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {message && (
                        <div className={`p-4 rounded-xl ${message.includes('успешно') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {message.includes('успешно') ? (
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">{message}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-4 mt-8">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !selectedUserId || !file}
                          className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
                            loading || !selectedUserId || !file
                              ? 'opacity-70 cursor-not-allowed'
                              : 'hover:translate-y-[-2px]'
                          }`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Обработка...
                            </span>
                          ) : (
                            'Сохранить'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-gray-200 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-2">
                    ID
                  </div>
                  <span className="text-xl font-semibold text-gray-800">Face Recognition System</span>
                </div>
                <p className="text-gray-500 mt-2">Безопасная система идентификации пользователей</p>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Помощь</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Поддержка</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Документация</a>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Face Recognition System. Все права защищены.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default FaceEncodingsPage;