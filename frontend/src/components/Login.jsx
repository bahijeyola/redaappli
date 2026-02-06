import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import api from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', { email, password });
            localStorage.setItem('user', JSON.stringify(res.data));
            if (res.data.role === 'admin') navigate('/admin');
            else navigate('/employee');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '3rem',
                borderRadius: '16px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                backdropFilter: 'blur(4px)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#1a73e8', margin: 0, fontSize: '2rem', fontWeight: '700' }}>TeamTracker</h1>
                    <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>Professional Workforce Management</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <Mail style={{ position: 'absolute', top: '12px', left: '12px', color: '#6c757d' }} size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <Lock style={{ position: 'absolute', top: '12px', left: '12px', color: '#6c757d' }} size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={16} style={{ marginRight: '8px' }} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a73e8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 4px 6px rgba(26, 115, 232, 0.2)',
                            transition: 'transform 0.1s'
                        }}
                    >
                        {loading ? 'Signing in...' : (
                            <>
                                <LogIn size={20} style={{ marginRight: '8px' }} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
