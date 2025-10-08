import { useState, useEffect } from 'react';
import trainingService from '../../services/trainingService';
import './VideoPlayer.css';

function VideoPlayer({ videoId, onClose, onVideoDeleted }) {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        tags: ''
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [videoId]);

    const fetchVideo = async () => {
        try {
            setLoading(true);
            const data = await trainingService.getVideo(videoId);
            setVideo(data.video);

            // Initialize edit form
            setEditForm({
                title: data.video.title || '',
                description: data.video.description || '',
                tags: ''
            });

            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form to original values
        setEditForm({
            title: video.title || '',
            description: video.description || '',
            tags: ''
        });
    };

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            const updateData = {
                title: editForm.title.trim(),
                description: editForm.description.trim()
            };

            await trainingService.updateVideo(videoId, updateData);

            // Refresh video data
            await fetchVideo();
            setIsEditing(false);
            alert('Video updated successfully!');
        } catch (err) {
            alert(`Failed to update video: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${video.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeleting(true);
            await trainingService.deleteVideo(videoId);
            alert('Video deleted successfully');
            onClose();
            if (onVideoDeleted) {
                onVideoDeleted(videoId);
            }
        } catch (err) {
            alert(`Failed to delete video: ${err.message}`);
            setDeleting(false);
        }
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

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const getAnalysisStatusBadge = (status) => {
        const badges = {
            'pending': { text: '⏳ Pending Analysis', class: 'pending' },
            'processing': { text: '⚙️ Processing', class: 'processing' },
            'completed': { text: '✓ Analysis Complete', class: 'completed' },
            'failed': { text: '✗ Analysis Failed', class: 'failed' }
        };
        return badges[status] || badges.pending;
    };

    if (loading) {
        return (
            <div className="video-player-overlay" onClick={onClose}>
                <div className="video-player-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="loading-player">Loading video...</div>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="video-player-overlay" onClick={onClose}>
                <div className="video-player-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="error-player">{error || 'Video not found'}</div>
                    <button className="close-player-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const badge = getAnalysisStatusBadge(video.analysis_status);

    return (
        <div className="video-player-overlay" onClick={onClose}>
            <div className="video-player-modal" onClick={(e) => e.stopPropagation()}>
                <div className="player-header">
                    {isEditing ? (
                        <input
                            type="text"
                            className="title-edit-input"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Video title"
                        />
                    ) : (
                        <h2>{video.title}</h2>
                    )}
                    <button className="close-player-btn" onClick={onClose}>✕</button>
                </div>

                <div className="player-body">
                    <div className="video-player-container">
                        <video
                            controls
                            autoPlay
                            src={`http://localhost:5000/api/training/videos/${video.id}/stream`}
                            className="player-video"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    <div className="video-details">
                        {isEditing ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        className="description-edit-textarea"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        placeholder="Add a description..."
                                        rows={4}
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button
                                        className="save-edit-btn"
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : '💾 Save Changes'}
                                    </button>
                                    <button
                                        className="cancel-edit-btn"
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="detail-section">
                                    <h3>Details</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Technique:</span>
                                            <span className="detail-value">{video.technique_name || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Style:</span>
                                            <span className="detail-value">{video.style || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Uploaded:</span>
                                            <span className="detail-value">{formatDate(video.created_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">File Size:</span>
                                            <span className="detail-value">{formatFileSize(video.file_size)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Status:</span>
                                            <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                                        </div>
                                    </div>
                                </div>

                                {video.description && (
                                    <div className="detail-section">
                                        <h3>Description</h3>
                                        <p className="video-description">{video.description}</p>
                                    </div>
                                )}

                                {video.analysis_status === 'completed' && video.analysis_feedback && (
                                    <div className="detail-section analysis-section">
                                        <h3>AI Analysis Feedback</h3>
                                        <div className="analysis-score">
                                            Score: <strong>{video.analysis_score}/100</strong>
                                        </div>
                                        <p className="analysis-feedback">{video.analysis_feedback}</p>
                                    </div>
                                )}

                                <div className="player-actions">
                                    <button
                                        className="edit-video-btn"
                                        onClick={handleEditClick}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="delete-video-btn"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? 'Deleting...' : '🗑️ Delete'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;