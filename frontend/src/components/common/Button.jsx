// frontend/src/components/DeleteConfirmationModal/Button.jsx
import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    loading = false,
    type = 'button',
    className = ''
}) => {
    const buttonStyles = {
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.6 : 1,
    };

    const variantStyles = {
        primary: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
        },
        secondary: {
            background: '#f3f4f6',
            color: '#374151',
            border: '2px solid #d1d5db',
        },
        danger: {
            background: '#ef4444',
            color: 'white',
        }
    };

    return (
        <button
            type={type}
            style={{ ...buttonStyles, ...variantStyles[variant] }}
            className={className}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? '⏳' : children}
        </button>
    );
};

export default Button;