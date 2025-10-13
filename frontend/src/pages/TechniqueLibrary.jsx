import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechniques } from '../services/api';
import TechniqueCard from '../components/TechniqueCard/TechniqueCard';
import SearchBar from '../components/SearchBar/SearchBar';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import './TechniqueLibrary.css';

function TechniquesLibrary() {
    const navigate = useNavigate();
    const [techniques, setTechniques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        style: '',
        difficulty: '',
        category: '',
        favoritesOnly: false
    });
    const [sortBy, setSortBy] = useState('name-asc');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        loadTechniques();
    }, []);

    const loadTechniques = async () => {
        try {
            setLoading(true);
            const data = await getTechniques();
            setTechniques(data.techniques);
        } catch (err) {
            console.error('Error fetching techniques:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and search logic
    const getFilteredTechniques = () => {
        let filtered = [...techniques];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(tech =>
                tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tech.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tech.style?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply filters
        if (filters.style) {
            filtered = filtered.filter(tech => tech.style === filters.style);
        }
        if (filters.difficulty) {
            filtered = filtered.filter(tech => tech.difficulty === filters.difficulty);
        }
        if (filters.category) {
            filtered = filtered.filter(tech => tech.category === filters.category);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'difficulty-asc':
                    const diffOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
                case 'difficulty-desc':
                    const diffOrderDesc = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    return (diffOrderDesc[b.difficulty] || 0) - (diffOrderDesc[a.difficulty] || 0);
                case 'recent':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const filteredTechniques = getFilteredTechniques();

    // Get unique values for filter options
    const filterOptions = {
        styles: [...new Set(techniques.map(t => t.style).filter(Boolean))],
        difficulties: ['Beginner', 'Intermediate', 'Advanced'],
        categories: [...new Set(techniques.map(t => t.category).filter(Boolean))],
        showFavoritesToggle: true
    };

    const handleClearFilters = () => {
        setFilters({
            style: '',
            difficulty: '',
            category: '',
            favoritesOnly: false
        });
        setSearchQuery('');
        setSortBy('name-asc');
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    if (loading) {
        return (
            <div className="techniques-library">
                <div className="library-header">
                    <h1>📚 Technique Library</h1>
                </div>
                <div className="loading">Loading techniques...</div>
            </div>
        );
    }

    return (
        <div className="techniques-library">
            {/* Header */}
            <div className="library-header">
                <div className="header-content">
                    <h1>📚 Technique Library</h1>
                    <p className="header-subtitle">
                        Browse and master martial arts techniques
                    </p>
                </div>
                <button
                    className="back-btn"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="🔍 Search techniques by name, style, or description..."
                />
            </div>

            {/* Filter Panel */}
            <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                filterOptions={filterOptions}
                onClearFilters={handleClearFilters}
                resultCount={filteredTechniques.length}
                totalCount={techniques.length}
            />

            {/* Controls Bar */}
            <div className="controls-bar">
                <div className="sort-controls">
                    <label className="control-label">Sort by:</label>
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="difficulty-asc">Difficulty (Easy First)</option>
                        <option value="difficulty-desc">Difficulty (Hard First)</option>
                        <option value="recent">Recently Added</option>
                    </select>
                </div>

                <div className="view-controls">
                    <label className="control-label">View:</label>
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            ⊞
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {filteredTechniques.length > 0 ? (
                <div className={`techniques-container ${viewMode}-view`}>
                    {filteredTechniques.map((technique) => (
                        <TechniqueCard
                            key={technique.id}
                            technique={technique}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No techniques found</h3>
                    <p>
                        {searchQuery || Object.values(filters).some(v => v)
                            ? 'Try adjusting your search or filters'
                            : 'No techniques available yet'}
                    </p>
                    {(searchQuery || Object.values(filters).some(v => v)) && (
                        <button
                            className="clear-all-btn"
                            onClick={handleClearFilters}
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default TechniquesLibrary;