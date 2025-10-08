import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [profileForm, setProfileForm] = useState({
        username: '',
        email: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
        loadStats();
    }, []);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    const loadProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
            setProfileForm({
                username: response.data.user.username,
                email: response.data.user.email
            });
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/auth/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const response = await api.put('/auth/profile', profileForm);
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setSuccess('Profile updated successfully!');
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (passwordForm.new_password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSaving(true);

        try {
            await api.put('/auth/password', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password
            });
            setSuccess('Password changed successfully!');
            setChangingPassword(false);
            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <nav className="navbar">
                <div className="nav-content">
                    <h1>🥋 DojoTracker</h1>
                    <div className="nav-right">
                        <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
                            Dashboard
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="profile-content">
                <h2>My Profile</h2>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {/* Training Stats */}
                {stats && (
                    <div className="stats-section">
                        <h3>Training Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📹</div>
                                <div className="stat-value">{stats.total_videos}</div>
                                <div className="stat-label">Total Videos</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⏱️</div>
                                <div className="stat-value">{stats.duration_formatted}</div>
                                <div className="stat-label">Training Time</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✓</div>
                                <div className="stat-value">{stats.analyzed_videos}</div>
                                <div className="stat-label">Analyzed Videos</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Information */}
                <div className="profile-section">
                    <div className="section-header">
                        <h3>Profile Information</h3>
                        {!editing && (
                            <button onClick={() => setEditing(true)} className="edit-btn">
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={profileForm.username}
                                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => {
                                    setEditing(false);
                                    setProfileForm({
                                        username: user.username,
                                        email: user.email
                                    });
                                }} className="cancel-btn" disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info">
                            <div className="info-row">
                                <span className="info-label">Username:</span>
                                <span className="info-value">{user?.username}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Member since:</span>
                                <span className="info-value">
                                    {new Date(user?.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Password */}
                <div className="profile-section">
                    <div className="section-header">
                        <h3>Security</h3>
                        {!changingPassword && (
                            <button onClick={() => setChangingPassword(true)} className="edit-btn">
                                Change Password
                            </button>
                        )}
                    </div>

                    {changingPassword && (
                        <form onSubmit={handlePasswordChange} className="profile-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => {
                                    setChangingPassword(false);
                                    setPasswordForm({
                                        current_password: '',
                                        new_password: '',
                                        confirm_password: ''
                                    });
                                }} className="cancel-btn" disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;