import { useState } from 'react';
import './FilterPanel.css';

/**
 * Advanced FilterPanel component with multiple filter types
 * @param {object} filters - Current filter values
 * @param {function} onFilterChange - Callback when filters change
 * @param {object} filterOptions - Available filter options
 * @param {function} onClearFilters - Callback to clear all filters
 * @param {number} resultCount - Number of results after filtering
 * @param {number} totalCount - Total number of items
 */
const FilterPanel = ({
    filters,
    onFilterChange,
    filterOptions = {},
    onClearFilters,
    resultCount,
    totalCount
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleFilterChange = (filterName, value) => {
        onFilterChange({
            ...filters,
            [filterName]: value
        });
    };

    const hasActiveFilters = () => {
        return Object.values(filters).some(value => value !== '' && value !== null);
    };

    return (
        <div className="filter-panel">
            <div className="filter-panel-header">
                <div className="filter-header-left">
                    <h3>Filters</h3>
                    {resultCount !== undefined && totalCount !== undefined && (
                        <span className="results-count">
                            Showing {resultCount} of {totalCount}
                        </span>
                    )}
                </div>
                <div className="filter-header-right">
                    {hasActiveFilters() && (
                        <button
                            className="clear-filters-btn"
                            onClick={onClearFilters}
                        >
                            Clear All
                        </button>
                    )}
                    <button
                        className="toggle-filters-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="filter-panel-body">
                    <div className="filter-grid">
                        {/* Style Filter */}
                        {filterOptions.styles && (
                            <div className="filter-item">
                                <label className="filter-label">Style</label>
                                <select
                                    className="filter-select"
                                    value={filters.style || ''}
                                    onChange={(e) => handleFilterChange('style', e.target.value)}
                                >
                                    <option value="">All Styles</option>
                                    {filterOptions.styles.map(style => (
                                        <option key={style} value={style}>{style}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Difficulty Filter */}
                        {filterOptions.difficulties && (
                            <div className="filter-item">
                                <label className="filter-label">Difficulty</label>
                                <select
                                    className="filter-select"
                                    value={filters.difficulty || ''}
                                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                                >
                                    <option value="">All Levels</option>
                                    {filterOptions.difficulties.map(diff => (
                                        <option key={diff} value={diff}>{diff}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Category Filter */}
                        {filterOptions.categories && (
                            <div className="filter-item">
                                <label className="filter-label">Category</label>
                                <select
                                    className="filter-select"
                                    value={filters.category || ''}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {filterOptions.categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Status Filter (for progress tracking) */}
                        {filterOptions.statuses && (
                            <div className="filter-item">
                                <label className="filter-label">Status</label>
                                <select
                                    className="filter-select"
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    {filterOptions.statuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Intensity Filter (for sessions) */}
                        {filterOptions.intensities && (
                            <div className="filter-item">
                                <label className="filter-label">Intensity</label>
                                <select
                                    className="filter-select"
                                    value={filters.intensity || ''}
                                    onChange={(e) => handleFilterChange('intensity', e.target.value)}
                                >
                                    <option value="">All Intensities</option>
                                    {filterOptions.intensities.map(intensity => (
                                        <option key={intensity} value={intensity}>{intensity}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date Range Filters */}
                        {filterOptions.showDateRange && (
                            <>
                                <div className="filter-item">
                                    <label className="filter-label">From Date</label>
                                    <input
                                        type="date"
                                        className="filter-input"
                                        value={filters.startDate || ''}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    />
                                </div>
                                <div className="filter-item">
                                    <label className="filter-label">To Date</label>
                                    <input
                                        type="date"
                                        className="filter-input"
                                        value={filters.endDate || ''}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Favorites Only Toggle */}
                        {filterOptions.showFavoritesToggle && (
                            <div className="filter-item filter-checkbox">
                                <label className="filter-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.favoritesOnly || false}
                                        onChange={(e) => handleFilterChange('favoritesOnly', e.target.checked)}
                                    />
                                    <span>Favorites Only ⭐</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;