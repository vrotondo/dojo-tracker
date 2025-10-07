import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';
import LoadingSpinner from '../../common/LoadingSpinner';
import VideoEditModal from './VideoEditModal';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import trainingService from '../../../services/trainingService';
import '../../../styles/components/video-library.css';

const VideoLibrary = ({ onSelectVideo, refreshTrigger }) => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        style: '',
        technique: '',
        analysis_status: ''
    });
    const [sortBy, setSortBy] = useState('newest');

    // Edit and Delete state
    const [editingVideo, setEditingVideo] = useState(null);
    const [deletingVideo, setDeletingVideo] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load videos
    const loadVideos = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await trainingService.getVideos();
            setVideos(response.videos || []);
            setStats(response.stats);
        } catch (error) {
            console.error('Failed to load videos:', error);
            setError('Failed to load videos. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
    }, [refreshTrigger]);

    // Apply filters and sorting
    useEffect(() => {
        let result = [...videos];

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(video =>
                video.title.toLowerCase().includes(searchLower) ||
                (video.description && video.description.toLowerCase().includes(searchLower)) ||
                (video.technique_name && video.technique_name.toLowerCase().includes(searchLower))
            );
        }

        // Apply style filter
        if (filters.style) {
            result = result.filter(video => video.style === filters.style);
        }

        // Apply technique filter
        if (filters.technique) {
            result = result.filter(video => video.technique_name === filters.technique);
        }

        // Apply analysis status filter
        if (filters.analysis_status) {
            result = result.filter(video => video.analysis_status === filters.analysis_status);
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'technique':
                result.sort((a, b) => (a.technique_name || '').localeCompare(b.technique_name || ''));
                break;
            default:
                break;
        }

        setFilteredVideos(result);
    }, [videos, filters, sortBy]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleVideoClick = (video) => {
        navigate(`/video/${video.id}`);
    };

    const handleEdit = (video, e) => {
        e.stopPropagation();
        setEditingVideo(video);
        setShowEditModal(true);
    };

    const handleEditSave = async (updatedData) => {
        try {
            const response = await trainingService.updateVideo(editingVideo.id, updatedData);

            // Update the video in the list
            setVideos(prev => prev.map(v =>
                v.id === editingVideo.id ? response.video : v
            ));

            setShowEditModal(false);
            setEditingVideo(null);
            showSuccessMessage('Video updated successfully');
        } catch (error) {
            console.error('Failed to update video:', error);
            throw error;
        }
    };

    const handleDelete = (video, e) => {
        e.stopPropagation();
        setDeletingVideo(video);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await trainingService.deleteVideo(deletingVideo.id);

            // Remove video from list
            setVideos(prev => prev.filter(v => v.id !== deletingVideo.id));

            setShowDeleteModal(false);
            setDeletingVideo(null);
            showSuccessMessage('Video deleted successfully');
        } catch (error) {
            console.error('Failed to delete video:', error);
            setError(error.response?.data?.message || 'Failed to delete video');
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const showSuccessMessage = (message) => {
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
            month: 'short',
            day: 'numeric'
        });
    };

    const getUniqueValues = (key) => {
        const values = videos
            .map(video => video[key])
            .filter(value => value && value.trim());
        return [...new Set(values)].sort();
    };

    if (isLoading) {
        return (
            <div className="video-library">
                <div className="loading-container">
                    <LoadingSpinner />
                    <p>Loading your videos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-library">
            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* Stats Bar */}
            {stats && (
                <div className="stats-bar">
                    <div className="stat-item">
                        <span className="stat-value">{stats.total_videos}</span>
                        <span className="stat-label">Total Videos</span>
                    </div>
                    {stats.total_duration_formatted && (
                        <div className="stat-item">
                            <span className="stat-value">{stats.total_duration_formatted}</span>
                            <span className="stat-label">Total Duration</span>
                        </div>
                    )}
                    {stats.analyzed_videos !== undefined && (
                        <div className="stat-item">
                            <span className="stat-value">{stats.analyzed_videos}</span>
                            <span className="stat-label">Analyzed</span>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="video-filters">
                <input
                    type="text"
                    placeholder="Search videos..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="search-input"
                />

                <select
                    value={filters.style}
                    onChange={(e) => handleFilterChange('style', e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Styles</option>
                    {getUniqueValues('style').map(style => (
                        <option key={style} value={style}>{style}</option>
                    ))}
                </select>

                <select
                    value={filters.technique}
                    onChange={(e) => handleFilterChange('technique', e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Techniques</option>
                    {getUniqueValues('technique_name').map(technique => (
                        <option key={technique} value={technique}>{technique}</option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="technique">Technique</option>
                </select>
            </div>

            {/* Video Grid */}
            {filteredVideos.length > 0 ? (
                <div className="video-grid">
                    {filteredVideos.map((video) => (
                        <div
                            key={video.id}
                            className="video-card"
                            onClick={() => handleVideoClick(video)}
                        >
                            <div className="video-thumbnail">
                                <div className="play-overlay">
                                    <div className="play-button">▶</div>
                                </div>
                                {video.duration_formatted && (
                                    <div className="video-duration">
                                        {video.duration_formatted}
                                    </div>
                                )}
                            </div>

                            <div className="video-card-content">
                                <h3 className="video-title">{video.title}</h3>

                                <div className="video-meta">
                                    {video.technique_name && (
                                        <span className="technique-badge">
                                            {video.technique_name}
                                        </span>
                                    )}
                                    {video.style && (
                                        <span className="style-badge">
                                            {video.style}
                                        </span>
                                    )}
                                </div>

                                <p className="video-date">{formatDate(video.created_at)}</p>

                                {video.analysis_status && (
                                    <span className={`analysis-status ${video.analysis_status}`}>
                                        {video.analysis_status === 'completed' && '✓ Analyzed'}
                                        {video.analysis_status === 'pending' && '⏳ Pending'}
                                        {video.analysis_status === 'processing' && '⚙️ Processing'}
                                    </span>
                                )}

                                <div className="video-actions">
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={(e) => handleEdit(video, e)}
                                        title="Edit video"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={(e) => handleDelete(video, e)}
                                        title="Delete video"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📹</div>
                    <h3>No videos found</h3>
                    <p>
                        {filters.search || filters.style || filters.technique
                            ? 'Try adjusting your filters'
                            : 'Upload your first training video to get started'}
                    </p>
                </div>
            )}

            {/* Modals */}
            {showEditModal && editingVideo && (
                <VideoEditModal
                    video={editingVideo}
                    onSave={handleEditSave}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingVideo(null);
                    }}
                />
            )}

            {showDeleteModal && deletingVideo && (
                <DeleteConfirmationModal
                    title="Delete Video"
                    message={`Are you sure you want to delete "${deletingVideo.title}"? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setDeletingVideo(null);
                    }}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default VideoLibrary;