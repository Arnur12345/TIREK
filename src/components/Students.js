import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import config from '../config'; // Importing config for base API URL

const Students = () => {
  const [students, setStudents] = useState([]);
  const [organizations, setOrganizations] = useState([]); // For dropdown
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(''); // Selected organization
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // State for loading
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true); // Start loading
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiBaseUrl}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStudents(response.data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to fetch students.');
      } finally {
        setLoading(false); // Stop loading
      }
    };
    fetchStudents();
  }, []);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiBaseUrl}/schools`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrganizations(response.data);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to fetch organizations.');
      }
    };
    fetchOrganizations();
  }, []);

  // Add new student
  const addStudent = async () => {
    if (!newStudentName.trim()) {
      setError('Student name cannot be empty.');
      return;
    }
    if (!selectedOrganization) {
      setError('Please select an organization.');
      return;
    }

    setLoading(true); // Start loading when adding a student
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiBaseUrl}/students`,
        {
          student_name: newStudentName,
          organization_id: selectedOrganization,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents([...students, { student_id: response.data.student_id, student_name: newStudentName }]);
      setNewStudentName('');
      setSelectedOrganization('');
      setIsModalOpen(false);
      setError('');
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого ученика?")) {
      return;
    }
  
    setLoading(true); // Start loading
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiBaseUrl}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Update the students list after successful deletion
      setStudents(students.filter((student) => student.student_id !== studentId));
      setError('');
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student.');
    } finally {
      setLoading(false); // Stop loading
    }
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white min-h-screen shadow-md rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Список учеников
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Поиск ученика..."
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
            <button
              className={`px-6 py-3 rounded-lg shadow-lg flex items-center ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 transition duration-200'
              }`}
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {loading ? 'Загрузка...' : 'Добавить ученика'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" role="alert">
            <p className="font-bold">Ошибка</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-hidden shadow-xl rounded-xl bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-left rounded-tl-xl">
                    Имя ученика
                  </th>
                  <th className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center rounded-tr-xl">
                    Действие
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.student_id} 
                    className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="px-6 py-4 text-gray-700 text-sm md:text-base font-medium">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                          {student.student_name.charAt(0).toUpperCase()}
                        </div>
                        {student.student_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition duration-200 flex items-center mx-auto"
                        onClick={() => deleteStudent(student.student_id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 mt-4 text-lg">Учеников не найдено.</p>
                <p className="text-gray-400">Добавьте нового ученика или измените параметры поиска</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Всего учеников: <span className="font-semibold">{filteredStudents.length}</span>
            </p>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-11/12 md:w-1/3 max-w-md">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Добавить нового ученика</h3>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="studentName">
                  Имя ученика
                </label>
                <input
                  id="studentName"
                  type="text"
                  placeholder="Введите имя ученика"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="organization">
                  Выберите организацию
                </label>
                <select
                  id="organization"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                >
                  <option value="" disabled>
                    Выберите организацию
                  </option>
                  {organizations.map((org) => (
                    <option key={org.school_id} value={org.school_id}>
                      {org.org_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400 transition duration-200"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewStudentName('');
                    setSelectedOrganization('');
                    setError('');
                  }}
                >
                  Отменить
                </button>
                <button
                  className={`px-4 py-2 rounded-lg shadow ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 transition duration-200'
                  }`}
                  onClick={addStudent}
                  disabled={loading}
                >
                  {loading ? 'Загрузка...' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Students;