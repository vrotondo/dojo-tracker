import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder/VideoRecorder';
import techniqueService from '../services/techniqueService';
import trainingService from '../services/trainingService';
import progressService from '../services/progressService';
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

    // Progress tracking state
    const [progress, setProgress] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        loadTechniqueDetails();
    }, [id]);

    useEffect(() => {
        if (technique) {
            loadUserVideos();
            loadProgress();
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

    const loadProgress = async () => {
        try {
            setLoadingProgress(true);
            const data = await progressService.getTechniqueProgress(id);

            if (data.tracking && data.progress) {
                setIsTracking(true);
                setProgress(data.progress);
                setNotes(data.progress.notes || '');
            } else {
                setIsTracking(false);
                setProgress(null);
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
            setIsTracking(false);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleStartTracking = async () => {
        try {
            const data = await progressService.startTracking(id);
            setProgress(data.progress);
            setIsTracking(true);
            alert('Started tracking progress for this technique!');
        } catch (error) {
            console.error('Failed to start tracking:', error);
            alert('Failed to start tracking. Please try again.');
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const data = await progressService.updateProgress(id, {
                proficiency_status: newStatus
            });
            setProgress(data.progress);

            if (newStatus === 'mastered') {
                alert('🎉 Congratulations on mastering this technique!');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    const handleToggleFavorite = async () => {
        try {
            const data = await progressService.updateProgress(id, {
                is_favorite: !progress.is_favorite
            });
            setProgress(data.progress);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSavingNotes(true);
            const data = await progressService.updateProgress(id, {
                notes: notes
            });
            setProgress(data.progress);
            setShowNotes(false);
            alert('Notes saved successfully!');
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes. Please try again.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleVideoUploadSuccess = async (uploadedVideo) => {
        console.log('Video uploaded successfully:', uploadedVideo);
        setShowRecorder(false);
        loadUserVideos();

        // Mark as practiced when video uploaded
        if (isTracking) {
            try {
                await progressService.markPracticed(id);
                loadProgress(); // Reload to get updated stats
            } catch (error) {
                console.error('Failed to mark as practiced:', error);
            }
        }

        alert(`Success! Your ${technique.name} practice has been saved.`);
    };

    const handleVideoClick = (videoId) => {
        navigate(`/video/${videoId}`);
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

    const getStatusColor = (status) => {
        const colors = {
            'learning': '#f59e0b',
            'practicing': '#3b82f6',
            'mastered': '#10b981'
        };
        return colors[status] || '#6b7280';
    };

    const getStatusEmoji = (status) => {
        const emojis = {
            'learning': '🟡',
            'practicing': '🔵',
            'mastered': '🟢'
        };
        return emojis[status] || '⚪';
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
                    <div className="header-top">
                        <h1>{technique.name}</h1>
                        {isTracking && (
                            <button
                                className="favorite-btn"
                                onClick={handleToggleFavorite}
                                title={progress?.is_favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                {progress?.is_favorite ? '⭐' : '☆'}
                            </button>
                        )}
                    </div>
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
                    {/* Progress Tracking Section */}
                    {!loadingProgress && (
                        <div className="progress-tracking-section">
                            {!isTracking ? (
                                <div className="start-tracking-banner">
                                    <div className="banner-content">
                                        <h3>📊 Track Your Progress</h3>
                                        <p>Start tracking this technique to monitor your proficiency and save personal notes!</p>
                                    </div>
                                    <button onClick={handleStartTracking} className="start-tracking-btn">
                                        Start Tracking
                                    </button>
                                </div>
                            ) : (
                                <div className="progress-card">
                                    <div className="progress-header">
                                        <h3>Your Progress</h3>
                                    </div>

                                    <div className="progress-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">Practice Sessions</span>
                                            <span className="stat-value">{progress?.practice_count || 0}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Total Time</span>
                                            <span className="stat-value">
                                                {Math.floor((progress?.total_practice_time || 0) / 60)}h {(progress?.total_practice_time || 0) % 60}m
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Last Practiced</span>
                                            <span className="stat-value">
                                                {progress?.last_practiced ? formatDate(progress.last_practiced) : 'Never'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="proficiency-selector">
                                        <label>Proficiency Status:</label>
                                        <div className="status-buttons">
                                            {['learning', 'practicing', 'mastered'].map(status => (
                                                <button
                                                    key={status}
                                                    className={`status-btn ${progress?.proficiency_status === status ? 'active' : ''}`}
                                                    onClick={() => handleUpdateStatus(status)}
                                                    style={{
                                                        borderColor: progress?.proficiency_status === status ? getStatusColor(status) : '#ddd',
                                                        backgroundColor: progress?.proficiency_status === status ? getStatusColor(status) : 'white',
                                                        color: progress?.proficiency_status === status ? 'white' : '#666'
                                                    }}
                                                >
                                                    {getStatusEmoji(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="notes-section">
                                        <button
                                            className="toggle-notes-btn"
                                            onClick={() => setShowNotes(!showNotes)}
                                        >
                                            {showNotes ? '📝 Hide Notes' : '📝 Add/Edit Notes'}
                                        </button>

                                        {showNotes && (
                                            <div className="notes-editor">
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Add your personal notes, goals, or tips for this technique..."
                                                    rows="4"
                                                    className="notes-textarea"
                                                />
                                                <div className="notes-actions">
                                                    <button
                                                        onClick={handleSaveNotes}
                                                        className="save-notes-btn"
                                                        disabled={savingNotes}
                                                    >
                                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowNotes(false);
                                                            setNotes(progress?.notes || '');
                                                        }}
                                                        className="cancel-notes-btn"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!showNotes && progress?.notes && (
                                            <div className="notes-preview">
                                                <p>{progress.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Video Section */}
                    <div className="video-section">
                        <h2>Reference Video</h2>
                        {videoId ? (
                            <div className="video-wrapper">
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={technique.name}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <div className="no-video">
                                <p>No reference video available for this technique</p>
                            </div>
                        )}
                    </div>

                    {/* Description Section */}
                    <div className="description-section">
                        <h2>About This Technique</h2>
                        <p>{technique.description || 'No description available.'}</p>
                    </div>

                    {/* Action Section */}
                    <div className="action-section">
                        <h3>Ready to Practice?</h3>
                        <button onClick={() => setShowRecorder(true)} className="practice-btn-large">
                            📹 Record Practice Session
                        </button>
                        <p className="practice-hint">
                            Record yourself performing this technique to track your progress
                        </p>
                    </div>

                    {/* History Section */}
                    <div className="history-section">
                        <h2>Your Practice History ({userVideos.length})</h2>
                        {loadingVideos ? (
                            <div className="loading-videos">
                                <p>Loading your videos...</p>
                            </div>
                        ) : userVideos.length > 0 ? (
                            <div className="video-history-grid">
                                {userVideos.map((video) => (
                                    <div
                                        key={video.id}
                                        className="video-history-card"
                                        onClick={() => handleVideoClick(video.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
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