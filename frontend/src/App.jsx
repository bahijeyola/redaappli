import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

// Check if user is logged in
const isAuthenticated = () => {
    const user = localStorage.getItem('user');
    return user !== null;
};

// Get user role
const getUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
        return JSON.parse(user).role;
    }
    return null;
};

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children, allowedRole }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    const role = getUserRole();
    if (allowedRole && role !== allowedRole) {
        return <Navigate to={role === 'admin' ? '/admin' : '/employee'} replace />;
    }
    return children;
};

// Login Route - redirects to dashboard if already logged in
const LoginRoute = () => {
    if (isAuthenticated()) {
        const role = getUserRole();
        return <Navigate to={role === 'admin' ? '/admin' : '/employee'} replace />;
    }
    return <Login />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginRoute />} />
                <Route path="/admin" element={
                    <ProtectedRoute allowedRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/employee" element={
                    <ProtectedRoute allowedRole="employee">
                        <EmployeeDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;

