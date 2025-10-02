import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechniques } from '../services/api';
import TechniqueCard from '../components/TechniqueCard/TechniqueCard';
import './Dashboard.css';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [techniques, setTechniques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ style: '', difficulty: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchTechniques();
    }, []);

    const fetchTechniques = async () => {
        try {
            const data = await getTechniques();
            setTechniques(data.techniques);
        } catch (err) {
            console.error('Error fetching techniques:', err);
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

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="nav-content">
                    <h1>🥋 DojoTracker</h1>
                    <div className="nav-right">
                        <span className="user-name">Welcome, {user?.username}!</span>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h2>Technique Library</h2>
                    <p>Select a technique to practice and get AI feedback</p>
                </div>

                <div className="filters">
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

                {loading ? (
                    <div className="loading">Loading techniques...</div>
                ) : (
                    <div className="techniques-grid">
                        {filteredTechniques.map((technique) => (
                            <TechniqueCard
                                key={technique.id}
                                technique={technique}
                            />
                        ))}
                    </div>
                )}

                {!loading && filteredTechniques.length === 0 && (
                    <div className="no-results">
                        No techniques found with the selected filters.
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;