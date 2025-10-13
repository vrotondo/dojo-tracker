import { useNavigate } from 'react-router-dom';
import './TechniqueCard.css';

function TechniqueCard({ technique, viewMode = 'grid' }) {
    const navigate = useNavigate();

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner':
                return '#4caf50';
            case 'Intermediate':
                return '#ff9800';
            case 'Advanced':
                return '#f44336';
            default:
                return '#999';
        }
    };

    if (viewMode === 'list') {
        return (
            <div
                className="technique-card list-view"
                onClick={() => navigate(`/technique/${technique.id}`)}
            >
                <div className="list-view-content">
                    <div className="list-view-left">
                        <h3 className="technique-name">{technique.name}</h3>
                        <p className="technique-description">{technique.description}</p>
                    </div>
                    <div className="list-view-right">
                        <div className="list-view-badges">
                            <span className="technique-style-badge">{technique.style}</span>
                            <span
                                className="difficulty-badge"
                                style={{ backgroundColor: getDifficultyColor(technique.difficulty) }}
                            >
                                {technique.difficulty}
                            </span>
                        </div>
                        <button className="view-details-btn">
                            View Details →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view (default)
    return (
        <div
            className="technique-card grid-view"
            onClick={() => navigate(`/technique/${technique.id}`)}
        >
            <div className="technique-header">
                <h3>{technique.name}</h3>
                <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(technique.difficulty) }}
                >
                    {technique.difficulty}
                </span>
            </div>

            <p className="technique-style">{technique.style}</p>

            <p className="technique-description">
                {technique.description}
            </p>

            <button className="practice-btn">
                View Details →
            </button>
        </div>
    );
}

export default TechniqueCard;