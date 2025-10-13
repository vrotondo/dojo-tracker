import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoEditModal from '../components/VideoPlayer/VideoEditModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal/DeleteConfirmationModal';
import trainingService from '../services/trainingService';
import '../pages/video-player-page.css';

// Simple inline Button component
const Button = ({ children, onClick, variant = 'primary', disabled = false }) => {
    const styles = {
        padding: '0.75rem 1.5rem',
        border: variant === 'secondary' ? '2px solid #d1d5db' : 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        background: variant === 'primary' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
            variant === 'danger' ? '#ef4444' : '#f3f4f6',
        color: variant === 'secondary' ? '#374151' : 'white',
    };
    return <button style={styles} onClick={onClick} disabled={disabled}>{children}</button>;
};

// Simple inline LoadingSpinner component  
const LoadingSpinner = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
    </div>
);

const VideoPlayerPage = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();

    const [video, setVideo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadVideo();
    }, [videoId]);

    const loadVideo = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await trainingService.getVideo(videoId);
            setVideo(response.video);
        } catch (error) {
            console.error('Failed to load video:', error);
            setError(error.response?.data?.message || 'Failed to load video');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleVideoUpdate = async (updatedData) => {
        try {
            await trainingService.updateVideo(videoId, updatedData);
            setShowEditModal(false);
            await loadVideo(); // Reload video data
        } catch (error) {
            console.error('Failed to update video:', error);
            throw error;
        }
    };

    const handleVideoDelete = async () => {
        try {
            setIsDeleting(true);
            await trainingService.deleteVideo(videoId);
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to delete video:', error);
            setError(error.response?.data?.message || 'Failed to delete video');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="video-player-page">
                <div className="loading-container">
                    <LoadingSpinner />
                    <p>Loading video...</p>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="video-player-page">
                <div className="error-container">
                    <h2>Error Loading Video</h2>
                    <p>{error || 'Video not found'}</p>
                    <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-player-page">
            <div className="page-header">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </Button>
                <div className="header-actions">
                    <Button variant="secondary" onClick={handleEdit}>Edit</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </div>
            </div>

            <div className="video-player-container">
                <video
                    controls
                    autoPlay
                    src={trainingService.getVideoStreamUrl(video.id)}
                    style={{ width: '100%', maxHeight: '600px', display: 'block', background: '#000' }}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="video-info-section">
                <div className="video-metadata">
                    <h1>{video.title}</h1>

                    <div className="video-meta-tags">
                        {video.technique_name && (
                            <span className="meta-tag technique">{video.technique_name}</span>
                        )}
                        {video.style && (
                            <span className="meta-tag style">{video.style}</span>
                        )}
                        <span className="meta-tag date">
                            {formatDate(video.created_at)}
                        </span>
                    </div>

                    {video.description && (
                        <div className="video-description">
                            <h3>Description</h3>
                            <p>{video.description}</p>
                        </div>
                    )}

                    <div className="video-details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Filename:</span>
                            <span className="detail-value">{video.filename}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">File Size:</span>
                            <span className="detail-value">
                                {(video.file_size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">
                                {video.duration ? `${video.duration}s` : 'Unknown'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Uploaded:</span>
                            <span className="detail-value">{formatDate(video.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {showEditModal && (
                <VideoEditModal
                    video={video}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleVideoUpdate}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmationModal
                    title="Delete Video"
                    message={`Are you sure you want to delete "${video.title}"? This action cannot be undone.`}
                    onConfirm={handleVideoDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default VideoPlayerPage;