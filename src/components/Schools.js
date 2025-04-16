import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import config from '../config'; // Import the config file

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch schools from API
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiBaseUrl}/schools`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSchools(response.data);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError('Failed to fetch schools. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Add a new school
  const addSchool = async () => {
    if (!newSchoolName.trim()) {
      setError("School name cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiBaseUrl}/schools`,
        { org_name: newSchoolName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSchools([...schools, { school_id: response.data.school_id, org_name: newSchoolName }]);
      setNewSchoolName(""); // Clear input
      setIsModalOpen(false); // Close modal
      setError(""); // Clear error
    } catch (err) {
      console.error('Error adding school:', err);
      setError('Failed to add school. Please try again.');
    }
  };

  const filteredSchools = schools.filter((school) =>
    school.org_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white min-h-screen shadow-md rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Школы
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Поиск..."
                className="p-2 pl-10 w-full md:w-64 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              className="p-2 w-full md:w-auto border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(parseInt(e.target.value))}
            >
              <option value={10}>10 записей на странице</option>
              <option value={25}>25 записей на странице</option>
              <option value={50}>50 записей на странице</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" role="alert">
            <p className="font-bold">Ошибка</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition duration-200 flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Добавить новую организацию
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-hidden shadow-xl rounded-xl bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-left rounded-tl-xl rounded-tr-xl">
                    Организация
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchools.slice(0, entriesPerPage).map((school, index) => (
                  <tr 
                    key={school.school_id} 
                    className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="px-6 py-4 text-gray-700 text-sm md:text-base font-medium">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                          {school.org_name.charAt(0).toUpperCase()}
                        </div>
                        {school.org_name}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSchools.length === 0 && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 16h.01M12 20h.01M17.194 16.56a8 8 0 10-10.389 0M12 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <p className="text-gray-500 mt-4 text-lg">Школ не найдено.</p>
                <p className="text-gray-400">Попробуйте изменить параметры поиска</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredSchools.length > 0 && (
          <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">
              Показано <span className="font-semibold">{Math.min(entriesPerPage, filteredSchools.length)}</span> из <span className="font-semibold">{filteredSchools.length}</span> организаций
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50" disabled>
                Предыдущая
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50" disabled>
                Следующая
              </button>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-11/12 md:w-1/3 max-w-md">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Добавить новую организацию</h3>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="schoolName">
                  Название организации
                </label>
                <input
                  id="schoolName"
                  type="text"
                  placeholder="Введите название школы"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400 transition duration-200"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewSchoolName("");
                    setError("");
                  }}
                >
                  Отменить
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200"
                  onClick={addSchool}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Schools;