import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/sessionService';
import './Sessions.css';

function Sessions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [filter, setFilter] = useState({ style: '' });

    const [formData, setFormData] = useState({
        title: '',
        style: '',
        duration: '',
        intensity: 'Medium',
        description: '',
        notes: '',
        location: '',
        session_date: new Date().toISOString().slice(0, 16)
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSessions();
        loadStats();
    }, [filter]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await sessionService.getSessions(filter);
            setSessions(response.sessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
            setError('Failed to load training sessions');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await sessionService.getSessionStats();
            setStats(response);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleCreate = () => {
        setFormData({
            title: '',
            style: '',
            duration: '',
            intensity: 'Medium',
            description: '',
            notes: '',
            location: '',
            session_date: new Date().toISOString().slice(0, 16)
        });
        setEditingSession(null);
        setShowCreateModal(true);
    };

    const handleEdit = (session) => {
        setFormData({
            title: session.title,
            style: session.style || '',
            duration: session.duration || '',
            intensity: session.intensity || 'Medium',
            description: session.description || '',
            notes: session.notes || '',
            location: session.location || '',
            session_date: session.session_date ? session.session_date.slice(0, 16) : new Date().toISOString().slice(0, 16)
        });
        setEditingSession(session);
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const sessionData = {
                ...formData,
                duration: parseInt(formData.duration) || 0
            };

            if (editingSession) {
                await sessionService.updateSession(editingSession.id, sessionData);
                setSuccess('Session updated successfully!');
            } else {
                await sessionService.createSession(sessionData);
                setSuccess('Session created successfully!');
            }

            setShowCreateModal(false);
            loadSessions();
            loadStats();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save session');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (sessionId) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;

        try {
            await sessionService.deleteSession(sessionId);
            setSuccess('Session deleted successfully!');
            loadSessions();
            loadStats();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete session');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const styles = [...new Set(sessions.map(s => s.style).filter(s => s))];

    return (
        <div className="sessions-container">
            <nav className="navbar">
                <div className="nav-content">
                    <h1>🥋 DojoTracker</h1>
                    <div className="nav-right">
                        <button onClick={() => navigate('/dashboard')} className="nav-btn">Dashboard</button>
                        <button onClick={() => navigate('/profile')} className="nav-btn">Profile</button>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="sessions-content">
                <div className="sessions-header">
                    <h2>Training Sessions</h2>
                    <button onClick={handleCreate} className="create-btn">+ Log New Session</button>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}

                {stats && (
                    <div className="stats-section">
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-value">{stats.total_sessions}</div>
                            <div className="stat-label">Total Sessions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⏱️</div>
                            <div className="stat-value">{stats.duration_formatted}</div>
                            <div className="stat-label">Training Time</div>
                        </div>
                    </div>
                )}

                <div className="sessions-filters">
                    <select
                        value={filter.style}
                        onChange={(e) => setFilter({ ...filter, style: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Styles</option>
                        {styles.map(style => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="loading">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="empty-state">
                        <p>No training sessions yet. Log your first session to track your progress!</p>
                    </div>
                ) : (
                    <div className="sessions-list">
                        {sessions.map(session => (
                            <div key={session.id} className="session-card">
                                <div className="session-header">
                                    <h3>{session.title}</h3>
                                    <div className="session-actions">
                                        <button onClick={() => handleEdit(session)} className="edit-btn">Edit</button>
                                        <button onClick={() => handleDelete(session.id)} className="delete-btn">Delete</button>
                                    </div>
                                </div>
                                <div className="session-meta">
                                    <span className="session-date">📅 {formatDate(session.session_date)}</span>
                                    {session.style && <span className="session-style">🥋 {session.style}</span>}
                                    {session.duration && <span className="session-duration">⏱️ {session.duration} min</span>}
                                    {session.intensity && <span className={`session-intensity ${session.intensity.toLowerCase()}`}>{session.intensity}</span>}
                                </div>
                                {session.description && <p className="session-description">{session.description}</p>}
                                {session.notes && <p className="session-notes"><strong>Notes:</strong> {session.notes}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.classList.contains('modal-overlay')) setShowCreateModal(false);
                }}>
                    <div className="modal-content session-modal">
                        <div className="modal-header">
                            <h2>{editingSession ? 'Edit Session' : 'Log New Session'}</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="session-form">
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g., Morning Muay Thai Training"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Style</label>
                                    <input
                                        type="text"
                                        value={formData.style}
                                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                        placeholder="e.g., Muay Thai, BJJ"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="60"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Intensity</label>
                                    <select
                                        value={formData.intensity}
                                        onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.session_date}
                                        onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Home Gym, Dojo"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What did you work on?"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any observations or things to improve?"
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sessions;