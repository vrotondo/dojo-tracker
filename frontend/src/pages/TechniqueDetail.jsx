import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder/VideoRecorder';
import techniqueService from '../services/techniqueService';
import trainingService from '../services/trainingService';
import './TechniqueDetail.css';

function TechniqueDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [technique, setTechnique] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRecorder, setShowRecorder] = useState(false);
    const [userVideos, setUserVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(false);

    useEffect(() => {
        loadTechniqueDetails();
    }, [id]);

    useEffect(() => {
        if (technique) {
            loadUserVideos();
        }
    }, [technique]);

    const loadTechniqueDetails = async () => {
        try {
            setLoading(true);
            const data = await techniqueService.getTechniqueById(id);
            setTechnique(data.technique);
            setError('');
        } catch (error) {
            console.error('Failed to load technique:', error);
            setError('Failed to load technique details');
        } finally {
            setLoading(false);
        }
    };

    const loadUserVideos = async () => {
        try {
            setLoadingVideos(true);
            const response = await trainingService.getVideos();

            // Filter videos for this technique
            const filtered = response.videos.filter(
                video => video.technique_name === technique.name ||
                    video.technique_id === parseInt(id)
            );

            setUserVideos(filtered);
        } catch (error) {
            console.error('Failed to load user videos:', error);
            setUserVideos([]);
        } finally {
            setLoadingVideos(false);
        }
    };

    const handleVideoUploadSuccess = (uploadedVideo) => {
        console.log('Video uploaded successfully:', uploadedVideo);
        setShowRecorder(false);
        loadUserVideos();
        alert(`Success! Your ${technique.name} practice has been saved.`);
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video?')) {
            return;
        }

        try {
            await trainingService.deleteVideo(videoId);
            alert('Video deleted successfully');
            loadUserVideos();
        } catch (error) {
            console.error('Failed to delete video:', error);
            alert('Failed to delete video');
        }
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'Beginner': '#10b981',
            'Intermediate': '#f59e0b',
            'Advanced': '#ef4444',
            'Expert': '#8b5cf6'
        };
        return colors[difficulty] || '#6b7280';
    };

    const getVideoId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        return match ? match[1] : null;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                        <button
                            className="practice-btn-large"
                            onClick={() => setShowRecorder(true)}
                        >
                            📹 Record Your Attempt
                        </button>
                        <p className="practice-hint">
                            Record yourself performing this technique to track your progress
                        </p>
                    </div>

                    <div className="history-section">
                        <h2>Your Previous Attempts</h2>
                        {loadingVideos ? (
                            <div className="loading-videos">
                                <p>Loading your videos...</p>
                            </div>
                        ) : userVideos.length > 0 ? (
                            <div className="video-history-grid">
                                {userVideos.map((video) => (
                                    <div key={video.id} className="video-history-card">
                                        <div className="video-thumbnail">
                                            <span className="play-icon">▶</span>
                                        </div>
                                        <div className="video-info">
                                            <h4>{video.title}</h4>
                                            <p className="video-date">
                                                {formatDate(video.created_at)}
                                            </p>
                                            {video.analysis_status && (
                                                <span className={`analysis-badge ${video.analysis_status}`}>
                                                    {video.analysis_status === 'completed' && '✓ Analyzed'}
                                                    {video.analysis_status === 'pending' && '⏳ Pending'}
                                                    {video.analysis_status === 'processing' && '⚙️ Processing'}
                                                </span>
                                            )}
                                            <div className="video-actions">
                                                <button
                                                    className="video-action-btn delete"
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    title="Delete video"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-attempts">
                                <p>You haven't practiced this technique yet.</p>
                                <p>Record your first attempt to start tracking your progress!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showRecorder && (
                <VideoRecorder
                    techniqueId={technique.id}
                    techniqueName={technique.name}
                    techniqueStyle={technique.style}
                    onClose={() => setShowRecorder(false)}
                    onSuccess={handleVideoUploadSuccess}
                />
            )}
        </div>
    );
}

export default TechniqueDetail;