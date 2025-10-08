import React, { useState, useEffect } from 'react';
import './video-edit-modal.css';

// Inline Button component to avoid import issues
const Button = ({ children, onClick, variant = 'primary', disabled = false, loading = false }) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        opacity: disabled ? 0.6 : 1,
        border: 'none',
    };

    const variants = {
        primary: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
        secondary: { background: '#f3f4f6', color: '#374151', border: '2px solid #d1d5db' },
    };

    return (
        <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick} disabled={disabled || loading}>
            {loading ? 'Saving...' : children}
        </button>
    );
};

const VideoEditModal = ({ video, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        technique_name: '',
        style: '',
        tags: '',
        is_private: true
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title || '',
                description: video.description || '',
                technique_name: video.technique_name || '',
                style: video.style || '',
                tags: Array.isArray(video.tags) ? video.tags.join(', ') : '',
                is_private: video.is_private !== undefined ? video.is_private : true
            });
        }
    }, [video]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }
        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description must be less than 1000 characters';
        }
        if (formData.technique_name && formData.technique_name.length > 100) {
            newErrors.technique_name = 'Technique name must be less than 100 characters';
        }
        if (formData.style && formData.style.length > 50) {
            newErrors.style = 'Style must be less than 50 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            const updateData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                technique_name: formData.technique_name.trim(),
                style: formData.style.trim(),
                tags: tags,
                is_private: formData.is_private
            };
            await onSave(updateData);
        } catch (error) {
            console.error('Save error:', error);
            setErrors({ general: error.response?.data?.message || 'Failed to update video' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content video-edit-modal">
                <div className="modal-header">
                    <h2>Edit Video</h2>
                    <button className="modal-close-btn" onClick={onClose} disabled={isSaving}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {errors.general && <div className="error-message general">{errors.general}</div>}

                    <div className="form-group">
                        <label htmlFor="edit-title">Title <span className="required">*</span></label>
                        <input
                            id="edit-title"
                            type="text"
                            className={`form-input ${errors.title ? 'error' : ''}`}
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter video title"
                            disabled={isSaving}
                        />
                        {errors.title && <span className="field-error">{errors.title}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-technique">Technique Name</label>
                        <input
                            id="edit-technique"
                            type="text"
                            className={`form-input ${errors.technique_name ? 'error' : ''}`}
                            value={formData.technique_name}
                            onChange={(e) => handleChange('technique_name', e.target.value)}
                            placeholder="e.g., Roundhouse Kick, Armbar"
                            disabled={isSaving}
                        />
                        {errors.technique_name && <span className="field-error">{errors.technique_name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-style">Martial Art Style</label>
                        <input
                            id="edit-style"
                            type="text"
                            className={`form-input ${errors.style ? 'error' : ''}`}
                            value={formData.style}
                            onChange={(e) => handleChange('style', e.target.value)}
                            placeholder="e.g., Muay Thai, BJJ, Karate"
                            disabled={isSaving}
                        />
                        {errors.style && <span className="field-error">{errors.style}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-description">Description</label>
                        <textarea
                            id="edit-description"
                            className={`form-textarea ${errors.description ? 'error' : ''}`}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Describe your video, training notes, or areas of focus..."
                            rows={4}
                            disabled={isSaving}
                        />
                        {errors.description && <span className="field-error">{errors.description}</span>}
                        <span className="field-hint">{formData.description.length}/1000 characters</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-tags">Tags</label>
                        <input
                            id="edit-tags"
                            type="text"
                            className="form-input"
                            value={formData.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            placeholder="e.g., training, sparring, competition"
                            disabled={isSaving}
                        />
                        <span className="field-hint">Separate tags with commas</span>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_private}
                                onChange={(e) => handleChange('is_private', e.target.checked)}
                                disabled={isSaving}
                            />
                            <span>Keep video private</span>
                        </label>
                        <span className="field-hint">Private videos are only visible to you</span>
                    </div>
                </form>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSaving} loading={isSaving}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VideoEditModal;