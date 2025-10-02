import { useNavigate } from 'react-router-dom';
import './TechniqueCard.css';

function TechniqueCard({ technique }) {
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

    return (
        <div className="technique-card" onClick={() => navigate(`/technique/${technique.id}`)}>
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