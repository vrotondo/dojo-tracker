import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import VideoEditModal from './VideoEditModal';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';
import trainingService from '../../services/trainingService';
import './video-library.css';

// Inline Button component
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
                video.title?.toLowerCase().includes(searchLower) ||
                video.technique_name?.toLowerCase().includes(searchLower) ||
                video.description?.toLowerCase().includes(searchLower)
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
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                default:
                    return 0;
            }
        });

        setFilteredVideos(result);
    }, [videos, filters, sortBy]);

    const handleVideoClick = (video) => {
        if (onSelectVideo) {
            onSelectVideo(video);
        } else {
            navigate(`/video/${video.id}`);
        }
    };

    const handleEdit = (video, e) => {
        e.stopPropagation();
        setEditingVideo(video);
        setShowEditModal(true);
    };

    const handleDelete = (video, e) => {
        e.stopPropagation();
        setDeletingVideo(video);
        setShowDeleteModal(true);
    };

    const handleEditSave = async (updatedData) => {
        try {
            const response = await trainingService.updateVideo(editingVideo.id, updatedData);
            setVideos(videos.map(v => v.id === editingVideo.id ? response.video : v));
            setShowEditModal(false);
            setEditingVideo(null);
        } catch (error) {
            console.error('Failed to update video:', error);
            throw error;
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await trainingService.deleteVideo(deletingVideo.id);
            setVideos(videos.filter(v => v.id !== deletingVideo.id));
            setShowDeleteModal(false);
            setDeletingVideo(null);
        } catch (error) {
            console.error('Failed to delete video:', error);
            setError(error.response?.data?.message || 'Failed to delete video');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
                    className="search-input"
                    placeholder="Search videos..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <select
                    className="filter-select"
                    value={filters.style}
                    onChange={(e) => setFilters({ ...filters, style: e.target.value })}
                >
                    <option value="">All Styles</option>
                    {getUniqueValues('style').map(style => (
                        <option key={style} value={style}>{style}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={filters.technique}
                    onChange={(e) => setFilters({ ...filters, technique: e.target.value })}
                >
                    <option value="">All Techniques</option>
                    {getUniqueValues('technique_name').map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                    ))}
                </select>
                <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
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
                                    <span className="video-duration">{video.duration_formatted}</span>
                                )}
                            </div>
                            <div className="video-card-content">
                                <h4 className="video-title">{video.title}</h4>
                                <div className="video-meta">
                                    {video.technique_name && (
                                        <span className="technique-badge">{video.technique_name}</span>
                                    )}
                                    {video.style && (
                                        <span className="style-badge">{video.style}</span>
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