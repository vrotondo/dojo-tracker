import React from 'react';
import Button from '../common/Button';
import './delete-confirmation-modal.css';

const DeleteConfirmationModal = ({
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDeleting = false
}) => {
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay') && !isDeleting) {
            onCancel();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isDeleting) {
            onCancel();
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isDeleting]);

    return (
        <div className="modal-overlay delete-modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content delete-confirmation-modal">
                <div className="delete-modal-icon">
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <div className="delete-modal-content">
                    <h2>{title}</h2>
                    <p>{message}</p>
                </div>

                <div className="delete-modal-actions">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        loading={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;