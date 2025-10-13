import { useState, useEffect } from 'react';
import trainingService from '../../services/trainingService';
import './VideoPlayer.css';

const VideoPlayer = ({ video: initialVideo, onClose, onUpdate, onDelete }) => {
    const [video, setVideo] = useState(initialVideo);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editForm, setEditForm] = useState({
        title: initialVideo.title,
        description: initialVideo.description || '',
        technique_name: initialVideo.technique_name || '',
        style: initialVideo.style || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setVideo(initialVideo);
        setEditForm({
            title: initialVideo.title,
            description: initialVideo.description || '',
            technique_name: initialVideo.technique_name || '',
            style: initialVideo.style || ''
        });
    }, [initialVideo]);

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            setError('');
            await trainingService.updateVideo(video.id, editForm);
            setVideo({ ...video, ...editForm });
            setIsEditing(false);
            if (onUpdate) onUpdate({ ...video, ...editForm });
        } catch (err) {
            console.error('Failed to update video:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${video.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsDeleting(true);
            await trainingService.deleteVideo(video.id);
            if (onDelete) onDelete(video.id);
            onClose();
        } catch (err) {
            console.error('Failed to delete video:', err);
            setError('Failed to delete video. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="video-player-modal">
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
                        src={trainingService.getVideoStreamUrl(video.id)}
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
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    className="cancel-edit-btn"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({
                                            title: video.title,
                                            description: video.description || '',
                                            technique_name: video.technique_name || '',
                                            style: video.style || ''
                                        });
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {video.description && (
                                <div className="description-section">
                                    <h3>Description</h3>
                                    <p>{video.description}</p>
                                </div>
                            )}

                            <div className="detail-grid">
                                {video.technique_name && (
                                    <div className="detail-item">
                                        <span className="detail-label">Technique:</span>
                                        <span className="detail-value">{video.technique_name}</span>
                                    </div>
                                )}
                                {video.style && (
                                    <div className="detail-item">
                                        <span className="detail-label">Style:</span>
                                        <span className="detail-value">{video.style}</span>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <span className="detail-label">Uploaded:</span>
                                    <span className="detail-value">
                                        {new Date(video.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Size:</span>
                                    <span className="detail-value">
                                        {(video.file_size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {!isEditing && (
                    <div className="player-actions">
                        <button className="edit-video-btn" onClick={() => setIsEditing(true)}>
                            Edit Video
                        </button>
                        <button
                            className="delete-video-btn"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Video'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;