import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechniques } from '../services/api';
import trainingService from '../services/trainingService';
import progressService from '../services/progressService';
import TechniqueCard from '../components/TechniqueCard/TechniqueCard';
import './Dashboard.css';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [techniques, setTechniques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ style: '', difficulty: '' });
    const [stats, setStats] = useState(null);
    const [recentVideos, setRecentVideos] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);
    const [progressStats, setProgressStats] = useState(null);
    const [favoriteTechniques, setFavoriteTechniques] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load all dashboard data in parallel
            const [
                techniquesData,
                videosData,
                sessionStatsData,
                progressData
            ] = await Promise.all([
                getTechniques(),
                trainingService.getVideos({ limit: 5 }),
                trainingService.getSessionStats(),
                progressService.getStats()
            ]);

            setTechniques(techniquesData.techniques);
            setRecentVideos(videosData.videos || []);
            setStats(sessionStatsData);
            setProgressStats(progressData);

            // Get favorite techniques
            if (progressData?.recently_practiced) {
                const favs = progressData.recently_practiced.filter(p => p.is_favorite);
                setFavoriteTechniques(favs);
            }

            // Get recent sessions if available
            if (sessionStatsData?.recent_sessions) {
                setRecentSessions(sessionStatsData.recent_sessions);
            }

        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const filteredTechniques = techniques.filter((tech) => {
        if (filter.style && tech.style !== filter.style) return false;
        if (filter.difficulty && tech.difficulty !== filter.difficulty) return false;
        return true;
    });

    const styles = [...new Set(techniques.map(t => t.style))];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="nav-content">
                    <h1>🥋 DojoTracker</h1>
                    <div className="nav-right">
                        <span className="user-name">Welcome, {user?.username}!</span>
                        <button onClick={() => navigate('/sessions')} className="sessions-btn">
                            Sessions
                        </button>
                        <button onClick={() => navigate('/profile')} className="profile-btn">
                            Profile
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                {loading ? (
                    <div className="loading">Loading dashboard...</div>
                ) : (
                    <>
                        {/* Quick Stats Overview */}
                        <div className="stats-overview">
                            <h2 className="section-title">📊 Your Training at a Glance</h2>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">🎥</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{recentVideos.length}</div>
                                        <div className="stat-label">Training Videos</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">⏱️</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats?.duration_formatted || '0m'}</div>
                                        <div className="stat-label">Total Practice Time</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📝</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats?.total_sessions || 0}</div>
                                        <div className="stat-label">Training Sessions</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🥋</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{progressStats?.total_tracked || 0}</div>
                                        <div className="stat-label">Techniques Tracked</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Favorite Techniques */}
                        {favoriteTechniques.length > 0 && (
                            <div className="favorites-section">
                                <div className="section-header">
                                    <h2 className="section-title">⭐ Favorite Techniques</h2>
                                    <button
                                        className="view-all-btn"
                                        onClick={() => navigate('/profile')}
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="favorites-grid">
                                    {favoriteTechniques.slice(0, 4).map((progress) => (
                                        <div
                                            key={progress.technique_id}
                                            className="favorite-card"
                                            onClick={() => navigate(`/technique/${progress.technique_id}`)}
                                        >
                                            <h4>{progress.technique?.name || 'Unknown Technique'}</h4>
                                            <div className="favorite-stats">
                                                <span className="practice-badge">
                                                    {progress.practice_count} practices
                                                </span>
                                                <span className={`status-badge status-${progress.proficiency_status}`}>
                                                    {progress.proficiency_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="activity-section">
                            <h2 className="section-title">🔥 Recent Activity</h2>
                            <div className="activity-grid">
                                {/* Recent Videos */}
                                <div className="activity-card">
                                    <div className="activity-header">
                                        <h3>📹 Recent Videos</h3>
                                        <button
                                            className="view-all-link"
                                            onClick={() => navigate('/sessions')}
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="activity-list">
                                        {recentVideos.length > 0 ? (
                                            recentVideos.slice(0, 3).map((video) => (
                                                <div
                                                    key={video.id}
                                                    className="activity-item"
                                                    onClick={() => navigate(`/video/${video.id}`)}
                                                >
                                                    <div className="activity-icon">🎥</div>
                                                    <div className="activity-details">
                                                        <div className="activity-name">{video.title}</div>
                                                        <div className="activity-meta">
                                                            {video.technique_name && <span>{video.technique_name}</span>}
                                                            <span className="activity-date">{formatDate(video.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p>No videos yet. Start recording!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Sessions */}
                                <div className="activity-card">
                                    <div className="activity-header">
                                        <h3>🏋️ Recent Sessions</h3>
                                        <button
                                            className="view-all-link"
                                            onClick={() => navigate('/sessions')}
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="activity-list">
                                        {recentSessions.length > 0 ? (
                                            recentSessions.slice(0, 3).map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="activity-item"
                                                    onClick={() => navigate('/sessions')}
                                                >
                                                    <div className="activity-icon">📝</div>
                                                    <div className="activity-details">
                                                        <div className="activity-name">{session.title}</div>
                                                        <div className="activity-meta">
                                                            {session.style && <span>{session.style}</span>}
                                                            <span>{session.duration} min</span>
                                                            <span className="activity-date">{formatDate(session.session_date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p>No sessions logged yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recently Practiced */}
                                <div className="activity-card">
                                    <div className="activity-header">
                                        <h3>🎯 Recently Practiced</h3>
                                    </div>
                                    <div className="activity-list">
                                        {progressStats?.recently_practiced?.length > 0 ? (
                                            progressStats.recently_practiced.slice(0, 3).map((progress) => (
                                                <div
                                                    key={progress.technique_id}
                                                    className="activity-item"
                                                    onClick={() => navigate(`/technique/${progress.technique_id}`)}
                                                >
                                                    <div className="activity-icon">🥋</div>
                                                    <div className="activity-details">
                                                        <div className="activity-name">
                                                            {progress.technique?.name || 'Unknown'}
                                                        </div>
                                                        <div className="activity-meta">
                                                            <span>{progress.practice_count} times</span>
                                                            <span className="activity-date">
                                                                {formatDate(progress.last_practiced)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p>Start tracking techniques!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technique Library */}
                        <div className="techniques-section">
                            <div className="section-header">
                                <h2 className="section-title">📚 Technique Library</h2>
                                <p className="section-subtitle">Select a technique to practice and track progress</p>
                            </div>

                            <div className="filters">
                                <input
                                    type="text"
                                    placeholder="🔍 Search techniques..."
                                    className="search-input"
                                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                />
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

                                <select
                                    value={filter.difficulty}
                                    onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                                    className="filter-select"
                                >
                                    <option value="">All Difficulties</option>
                                    {difficulties.map(diff => (
                                        <option key={diff} value={diff}>{diff}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="techniques-grid">
                                {filteredTechniques.map((technique) => (
                                    <TechniqueCard
                                        key={technique.id}
                                        technique={technique}
                                    />
                                ))}
                            </div>

                            {filteredTechniques.length === 0 && (
                                <div className="no-results">
                                    No techniques found with the selected filters.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;