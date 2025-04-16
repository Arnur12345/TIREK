import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import Schools from './components/Schools';
import Students from './components/Students';
import Events from './components/Events';
import FaceEncodingsPage from './components/FaceEncodingsPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public route for Login */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/schools" element={<PrivateRoute><Schools /></PrivateRoute>} />
                <Route path="/students" element={<PrivateRoute><Students /></PrivateRoute>} />
                <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                <Route path="/face_encodings" element={<PrivateRoute><FaceEncodingsPage/> </PrivateRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
