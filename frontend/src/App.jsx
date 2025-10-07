import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth Components
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import TechniqueDetail from './pages/TechniqueDetail';
import Training from './pages/Training';
import Exercises from './pages/Exercises';
import Workouts from './pages/Workouts';
import Profile from './pages/Profile';
import VideoPlayerPage from './pages/VideoPlayerPage';

// Layout
import Layout from './components/layout/Layout';

import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/technique/:id" element={<TechniqueDetail />} />
                    <Route path="/training" element={<Training />} />
                    <Route path="/exercises" element={<Exercises />} />
                    <Route path="/workouts" element={<Workouts />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/video/:videoId" element={<VideoPlayerPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;