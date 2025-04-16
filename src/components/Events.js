import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Layout from "./Layout";
import config from '../config';
import { 
    RiFilter3Line,
    RiAlertLine,
    RiLoginBoxLine,
    RiLogoutBoxLine,
    RiTimeLine,
    RiUserLine,
    RiRefreshLine,
    RiCloseLine
} from 'react-icons/ri';
import fightImage from '../assets/detected.jpg';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [weeklyEvents, setWeeklyEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const API_BASE_URL = `${config.apiBaseUrl}/events`;

  const eventTypeTranslation = {
    STUDENT_ENTRANCE: "Вход студента",
    STUDENT_EXIT: "Выход студента",
    FIGHTING: "Драка",
    SMOKING: "Курение",
    WEAPON: "Оружие",
    LYING_MAN: "Лежащий человек",
  };

  const fetchEvents = useCallback(async (type) => {
    setLoading(true);
    setError("");
    try {
      let endpoint = `${API_BASE_URL}`;
      switch (type) {
        case "danger":
          endpoint = `${API_BASE_URL}/danger`;
          break;
        case "entrance":
          endpoint = `${API_BASE_URL}/entrance`;
          break;
        case "exit":
          endpoint = `${API_BASE_URL}/exit`;
          break;
        case "irrelevant":
          endpoint = `${API_BASE_URL}/irrelevant`;
          break;
        case "lying":
          endpoint = `${API_BASE_URL}/lying`;
          break;
        case "all":
        default:
          endpoint = `${API_BASE_URL}/all`;
      }
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error.response?.data || error.message);
      setError("Failed to fetch events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchEvents(filter);
  }, [filter, fetchEvents]);

  const fetchEventCount = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setEventCount(response.data.event_count);
    } catch (error) {
      console.error("Error fetching event count:", error.response?.data || error.message);
      setError("Failed to fetch event count.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/weekly`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setWeeklyEvents(response.data);
    } catch (error) {
      console.error("Error fetching weekly events:", error.response?.data || error.message);
      setError("Failed to fetch weekly events.");
    } finally {
      setLoading(false);
    }
  };

  const filterButtons = [
    { id: 'all', label: 'Все события', icon: <RiFilter3Line />, color: 'indigo' },
    { id: 'danger', label: 'Инциденты', icon: <RiAlertLine />, color: 'red' },
    { id: 'lying', label: 'Лежащий человек', icon: <RiUserLine />, color: 'orange' },
    { id: 'entrance', label: 'Входы', icon: <RiLoginBoxLine />, color: 'emerald' },
    { id: 'exit', label: 'Выходы', icon: <RiLogoutBoxLine />, color: 'violet' },
    { id: 'irrelevant', label: 'Опоздания', icon: <RiTimeLine />, color: 'amber' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Журнал событий</h1>
          <button
            onClick={fetchEventCount}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
          >
            <RiRefreshLine className="text-lg" />
            <span>Обновить</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                        ${filter === btn.id 
                          ? `bg-${btn.color}-600 text-white shadow-md` 
                          : `bg-white text-gray-600 hover:bg-${btn.color}-50 border border-gray-200`}`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">События</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип события
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имя ученика
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Камера
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr 
                      key={event.event_id}
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${getEventTypeStyle(event.event_type)}`}>
                          {eventTypeTranslation[event.event_type] || event.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {event.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {event.camera_id || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Не найдено событий.
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 animate-fade-in-scale">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Детали события</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-gray-700">
                <RiCloseLine size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Время</p>
                  <p className="font-medium">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Тип события</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeStyle(selectedEvent.event_type)}`}>
                    {eventTypeTranslation[selectedEvent.event_type] || selectedEvent.event_type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Имя ученика</p>
                  <p className="font-medium">{selectedEvent.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Камера</p>
                  <p className="font-medium">{selectedEvent.camera_id || "N/A"}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <img 
                  src={fightImage} 
                  alt="Event" 
                  className="w-full h-64 object-cover rounded-lg shadow-lg animate-fade-in-scale"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const getEventTypeStyle = (eventType) => {
  const styles = {
    STUDENT_ENTRANCE: 'bg-emerald-100 text-emerald-800',
    STUDENT_EXIT: 'bg-violet-100 text-violet-800',
    FIGHTING: 'bg-red-100 text-red-800',
    SMOKING: 'bg-orange-100 text-orange-800',
    WEAPON: 'bg-red-100 text-red-800',
    LYING_MAN: 'bg-amber-100 text-amber-800',
  };
  return styles[eventType] || 'bg-gray-100 text-gray-800';
};

export default EventsPage;
