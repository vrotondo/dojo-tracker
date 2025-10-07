import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/features/training/VideoPlayer';
import VideoEditModal from '../components/features/training/VideoEditModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import trainingService from '../services/trainingService';
import '../styles/pages/video-player-page.css';

const VideoPlayerPage = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();

    const [video, setVideo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load video details
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

    const handleEditSave = async (updatedData) => {
        try {
            const response = await trainingService.updateVideo(videoId, updatedData);
            setVideo(response.video);
            setShowEditModal(false);
            showSuccessMessage('Video updated successfully');
        } catch (error) {
            console.error('Failed to update video:', error);
            throw error;
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await trainingService.deleteVideo(videoId);
            showSuccessMessage('Video deleted successfully');
            navigate('/training?tab=videos');
        } catch (error) {
            console.error('Failed to delete video:', error);
            setError(error.response?.data?.message || 'Failed to delete video');
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const showSuccessMessage = (message) => {
        // Simple success notification - you can replace with a toast library
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                    <Button onClick={() => navigate('/training?tab=videos')}>
                        Back to Videos
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-player-page">
            {/* Header */}
            <div className="page-header">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/training?tab=videos')}
                >
                    ← Back to Videos
                </Button>
                <div className="header-actions">
                    <Button variant="secondary" onClick={handleEdit}>
                        Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            </div>

            {/* Video Player */}
            <div className="video-player-container">
                <VideoPlayer
                    video={video}
                    onClose={() => navigate('/training?tab=videos')}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Video Information */}
            <div className="video-info-section">
                <div className="video-metadata">
                    <h1>{video.title}</h1>

                    <div className="video-meta-tags">
                        {video.technique_name && (
                            <span className="meta-tag technique">
                                🥋 {video.technique_name}
                            </span>
                        )}
                        {video.style && (
                            <span className="meta-tag style">
                                {video.style}
                            </span>
                        )}
                        {video.analysis_status && (
                            <span className={`meta-tag analysis ${video.analysis_status}`}>
                                {video.analysis_status === 'completed' && '✓ Analyzed'}
                                {video.analysis_status === 'pending' && '⏳ Pending Analysis'}
                                {video.analysis_status === 'processing' && '⚙️ Processing'}
                            </span>
                        )}
                    </div>

                    <div className="video-details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Uploaded:</span>
                            <span className="detail-value">{formatDate(video.created_at)}</span>
                        </div>
                        {video.duration && (
                            <div className="detail-item">
                                <span className="detail-label">Duration:</span>
                                <span className="detail-value">{video.duration_formatted}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="detail-label">Size:</span>
                            <span className="detail-value">{video.file_size_mb} MB</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Privacy:</span>
                            <span className="detail-value">
                                {video.is_private ? '🔒 Private' : '🌍 Public'}
                            </span>
                        </div>
                    </div>

                    {video.description && (
                        <div className="video-description">
                            <h3>Description</h3>
                            <p>{video.description}</p>
                        </div>
                    )}

                    {video.tags && video.tags.length > 0 && (
                        <div className="video-tags">
                            <h3>Tags</h3>
                            <div className="tags-list">
                                {video.tags.map((tag, index) => (
                                    <span key={index} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Analysis Results Section */}
                {video.analysis_status === 'completed' && video.analysis_results && (
                    <div className="analysis-results-section">
                        <h2>AI Analysis Results</h2>
                        <div className="analysis-content">
                            {video.analysis_score && (
                                <div className="analysis-score">
                                    <span className="score-label">Overall Score:</span>
                                    <span className="score-value">{video.analysis_score}/10</span>
                                </div>
                            )}
                            {/* Add more analysis result display here */}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showEditModal && (
                <VideoEditModal
                    video={video}
                    onSave={handleEditSave}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmationModal
                    title="Delete Video"
                    message={`Are you sure you want to delete "${video.title}"? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setShowDeleteModal(false)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default VideoPlayerPage;