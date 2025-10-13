import { useState, useEffect } from 'react';
import './SearchBar.css';

/**
 * Reusable SearchBar component with real-time filtering
 * @param {string} value - Current search value
 * @param {function} onChange - Callback when search changes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showClear - Show clear button when text exists
 */
const SearchBar = ({
    value,
    onChange,
    placeholder = '🔍 Search...',
    showClear = true
}) => {
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className="search-bar-container">
            <input
                type="text"
                className="search-bar-input"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                autoComplete="off"
            />
            {showClear && localValue && (
                <button
                    className="search-clear-btn"
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default SearchBar;