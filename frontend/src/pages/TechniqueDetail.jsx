import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTechnique } from '../services/api';
import './TechniqueDetail.css';

function TechniqueDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [technique, setTechnique] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTechnique();
    }, [id]);

    const fetchTechnique = async () => {
        try {
            setLoading(true);
            const data = await getTechnique(id);
            setTechnique(data.technique);
        } catch (err) {
            setError('Failed to load technique');
            console.error('Error fetching technique:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner':
                return '#4caf50';
            case 'Intermediate':
                return '#ff9800';
            case 'Advanced':
                return '#f44336';
            default:
                return '#999';
        }
    };

    const getVideoId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? match[1] : null;
    };

    if (loading) {
        return (
            <div className="technique-detail-container">
                <div className="loading">Loading technique...</div>
            </div>
        );
    }

    if (error || !technique) {
        return (
            <div className="technique-detail-container">
                <div className="error-message">{error || 'Technique not found'}</div>
                <button onClick={() => navigate('/dashboard')} className="back-btn">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const videoId = getVideoId(technique.reference_video_url);

    return (
        <div className="technique-detail-container">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
                ← Back to Library
            </button>

            <div className="technique-detail-content">
                <div className="technique-header-section">
                    <h1>{technique.name}</h1>
                    <div className="technique-meta">
                        <span className="style-tag">🥋 {technique.style}</span>
                        <span
                            className="difficulty-tag"
                            style={{ backgroundColor: getDifficultyColor(technique.difficulty) }}
                        >
                            {technique.difficulty}
                        </span>
                    </div>
                </div>

                <div className="technique-body">
                    <div className="video-section">
                        <h2>Reference Video</h2>
                        {videoId ? (
                            <div className="video-wrapper">
                                <iframe
                                    width="100%"
                                    height="400"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="Technique Reference Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <div className="no-video">
                                <p>No reference video available for this technique yet.</p>
                            </div>
                        )}
                    </div>

                    <div className="description-section">
                        <h2>Description</h2>
                        <p>{technique.description}</p>
                    </div>

                    <div className="action-section">
                        <button className="practice-btn-large">
                            📹 Record Your Attempt
                        </button>
                        <p className="practice-hint">
                            Record yourself performing this technique to get AI feedback
                        </p>
                    </div>

                    <div className="history-section">
                        <h2>Your Previous Attempts</h2>
                        <div className="no-attempts">
                            <p>You haven't practiced this technique yet.</p>
                            <p>Record your first attempt to start tracking your progress!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TechniqueDetail;